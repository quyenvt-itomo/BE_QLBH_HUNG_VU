import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerDebtOffsetRepository } from "./partnerDebtOffset.repository";
import { PARTNER_DEBT_OFFSET_TYPES } from "./partnerDebtOffset.types";
import { PartnerDebtOffset } from "@/database/models/company/PartnerDebtOffset";
import {
  PartnerDebtOffsetLine,
  PartnerDebtOffsetSideEnum,
} from "@/database/models/company/PartnerDebtOffsetLine";
import { Invoice, InvoiceType } from "@/database/models/company/Invoice";
import { DeepPartial, EntityManager, In } from "typeorm";
import { PARTNER_TYPES, PartnerRepository } from "@/module/partner";
import {
  INVOICE_TYPES,
  InvoiceRepository,
  InvoiceService,
} from "@/module/invoice";
import {
  PARTNER_DEBT_SYNC_TYPES,
  PartnerDebtSyncService,
} from "@/module/partnerDebtSync";
import { BadRequestError } from "@/shared/types/errors";
import { OffsetLineDto } from "./partnerDebtOffset.validator";

@injectable()
export class PartnerDebtOffsetService extends BaseService<PartnerDebtOffset> {
  protected repository: PartnerDebtOffsetRepository;
  protected uniqueFields: (keyof PartnerDebtOffset)[] = ["code"];
  protected uniqueScope?: (keyof PartnerDebtOffset)[] = ["storeId"];
  protected searchableFields = ["code"];

  constructor(
    @inject(PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetRepository)
    repository: PartnerDebtOffsetRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(INVOICE_TYPES.InvoiceRepository)
    private invoiceRepository: InvoiceRepository,
    @inject(INVOICE_TYPES.InvoiceService)
    private invoiceService: InvoiceService,
    @inject(PARTNER_DEBT_SYNC_TYPES.PartnerDebtSyncService)
    private partnerDebtSync: PartnerDebtSyncService,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<PartnerDebtOffset>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.partnerId) {
      data.partnerSnapshot = await this.partnerRepository.getSnapshot(
        data.partnerId,
        manager,
      );
    }
    await this.buildAndValidateLines(data, manager);
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<PartnerDebtOffset>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.partnerId !== undefined) {
      data.partnerSnapshot = data.partnerId
        ? await this.partnerRepository.getSnapshot(data.partnerId, manager)
        : null;
    }
    if (data.payableLines !== undefined || data.receivableLines !== undefined) {
      await this.buildAndValidateLines(data, manager, id);
      // repo.update không cascade relation -> thay thế lines ngay trong validate (cùng transaction)
      await manager
        .getRepository(PartnerDebtOffsetLine)
        .delete({ offsetId: id });
      const lines = (data.lines as PartnerDebtOffsetLine[]).map((l) => ({
        ...l,
        offsetId: id,
      }));
      await manager.getRepository(PartnerDebtOffsetLine).save(lines);
      data.lines = lines as PartnerDebtOffsetLine[];
    }
  }

  async actionAfterCreate(
    data: PartnerDebtOffset,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.lines?.length) {
      const lines = (data.lines as PartnerDebtOffsetLine[]).map((l) => ({
        ...l,
        offsetId: data.id,
      }));
      await manager.getRepository(PartnerDebtOffsetLine).save(lines);
      data.lines = lines as PartnerDebtOffsetLine[];
    }
    await this.partnerDebtSync.syncForOffset(data, data.lines || [], manager);
    await this.recalculateLines(data.lines || [], manager);
  }

  async actionAfterUpdate(
    data: PartnerDebtOffset,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // lines đã được thay thế trong validateBeforeUpdate
    await this.partnerDebtSync.syncForOffset(data, data.lines || [], manager);
    await this.recalculateLines(data.lines || [], manager);
  }

  async actionAfterDelete(
    data: PartnerDebtOffset,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const oldLines = await manager
      .getRepository(PartnerDebtOffsetLine)
      .find({ where: { offsetId: data.id } as any });
    // syncForOffset thực hiện deleteByRef(DEBT_OFFSET, id) trước khi insert
    await this.partnerDebtSync.syncForOffset(
      { ...data, lines: [] } as unknown as PartnerDebtOffset,
      [],
      manager,
    );
    await this.recalculateLines(oldLines, manager);
  }

  /** Tính lại nợ đã trả / còn lại cho các hóa đơn trong phiếu đối trừ. */
  private async recalculateLines(
    lines: PartnerDebtOffsetLine[],
    manager: EntityManager,
  ): Promise<void> {
    const invoiceIds = Array.from(
      new Set((lines || []).map((l) => l.invoiceId).filter(Boolean)),
    );
    for (const invoiceId of invoiceIds) {
      await this.invoiceService.recalculatePaidAmounts(invoiceId, manager);
    }
  }

  /**
   * Dựng các dòng đối trừ (snapshot hóa đơn), kiểm tra:
   *  - mỗi hóa đơn thuộc partner và đúng side (INPUT→payable, OUTPUT→receivable)
   *  - tổng 2 phía bằng nhau và > 0
   *  - không vượt quá số dư hiện có của từng phía
   */
  private async buildAndValidateLines(
    data: DeepPartial<PartnerDebtOffset>,
    manager: EntityManager,
    offsetId?: string,
  ): Promise<void> {
    const partnerId = data.partnerId;
    if (!partnerId) {
      throw new BadRequestError("Vui lòng chọn đối tác", "partnerId");
    }

    const payableLines = (data.payableLines || []) as OffsetLineDto[];
    const receivableLines = (data.receivableLines || []) as OffsetLineDto[];

    if (!payableLines.length && !receivableLines.length) {
      throw new BadRequestError(
        "Vui lòng chọn ít nhất 1 hóa đơn để đối trừ",
        "lines",
      );
    }

    const payable = await this.buildLines(
      partnerId,
      PartnerDebtOffsetSideEnum.PAYABLE,
      payableLines,
      manager,
    );
    const receivable = await this.buildLines(
      partnerId,
      PartnerDebtOffsetSideEnum.RECEIVABLE,
      receivableLines,
      manager,
    );

    const payableTotal = payable.reduce((s, l) => s + Number(l.amount || 0), 0);
    const receivableTotal = receivable.reduce(
      (s, l) => s + Number(l.amount || 0),
      0,
    );

    if (payableTotal !== receivableTotal) {
      throw new BadRequestError(
        `Tổng giá trị giảm trừ 2 bên phải bằng nhau (payable ${payableTotal} ≠ receivable ${receivableTotal})`,
        "receivableLines",
      );
    }
    if (payableTotal <= 0) {
      throw new BadRequestError("Số tiền đối trừ phải lớn hơn 0", "lines");
    }

    // snapshot số dư tại thời điểm offset
    const { payableDebtAmount, receivableDebtAmount } =
      await this.partnerDebtSync.getDebtAtDate(
        partnerId,
        data.occurredAt!,
        manager,
      );

    if (payableTotal > payableDebtAmount) {
      throw new BadRequestError(
        `Giá trị đối trừ phía phải trả (${payableTotal}) vượt quá số dư hiện có (${payableDebtAmount})`,
        "payableLines",
      );
    }
    if (receivableTotal > receivableDebtAmount) {
      throw new BadRequestError(
        `Giá trị đối trừ phía phải thu (${receivableTotal}) vượt quá số dư hiện có (${receivableDebtAmount})`,
        "receivableLines",
      );
    }

    data.payableDebtAmount = payableDebtAmount;
    data.receivableDebtAmount = receivableDebtAmount;
    data.payableTotalAmount = payableTotal;
    data.receivableTotalAmount = receivableTotal;
    data.offsetAmount = payableTotal;
    data.lines = [
      ...payable.map((l) => ({ ...l, offsetId: offsetId as string })),
      ...receivable.map((l) => ({ ...l, offsetId: offsetId as string })),
    ];
  }

  private async buildLines(
    partnerId: string,
    side: PartnerDebtOffsetSideEnum,
    items: OffsetLineDto[],
    manager: EntityManager,
  ): Promise<Partial<PartnerDebtOffsetLine>[]> {
    if (!items.length) return [];
    const invoiceIds = items.map((i) => i.invoiceId);

    const repo = manager.getRepository(Invoice);
    const invoices = await repo.find({
      where: { id: In(invoiceIds), deletedAt: undefined as any },
    });

    const byId = new Map(invoices.map((iv) => [iv.id, iv]));
    const lines: Partial<PartnerDebtOffsetLine>[] = [];

    for (const item of items) {
      const invoice = byId.get(item.invoiceId);
      if (!invoice) {
        throw new BadRequestError(
          "Không tìm thấy hóa đơn trong danh sách đối trừ",
          "lines",
        );
      }
      if (invoice.partnerId !== partnerId) {
        throw new BadRequestError(
          `Hóa đơn ${invoice.invoiceNumber} không thuộc đối tác đã chọn`,
          "lines",
        );
      }
      const invoiceSide: PartnerDebtOffsetSideEnum =
        invoice.type === InvoiceType.INPUT
          ? PartnerDebtOffsetSideEnum.PAYABLE
          : PartnerDebtOffsetSideEnum.RECEIVABLE;
      if (invoiceSide !== side) {
        throw new BadRequestError(
          `Hóa đơn ${invoice.invoiceNumber} không thuộc phía ${side === PartnerDebtOffsetSideEnum.PAYABLE ? "phải trả" : "phải thu"}`,
          "lines",
        );
      }
      lines.push({
        side,
        invoiceId: invoice.id,
        invoiceSnapshot: await this.invoiceRepository.getSnapshot(
          invoice.id,
          manager,
        ),
        invoiceCode: invoice.invoiceNumber,
        invoiceType: invoice.type,
        amount: Number(item.amount),
      });
    }
    return lines;
  }
}
