import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerDebtAdjustmentRepository } from "./partnerDebtAdjustment.repository";
import { PARTNER_DEBT_ADJUSTMENT_TYPES } from "./partnerDebtAdjustment.types";
import { PartnerDebtAdjustment } from "@/database/models/company/PartnerDebtAdjustment";
import { DeepPartial, EntityManager } from "typeorm";
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
import { PartnerDebtRefTypeEnum } from "@/database/models/company/DebtTransaction";

@injectable()
export class PartnerDebtAdjustmentService extends BaseService<PartnerDebtAdjustment> {
  protected repository: PartnerDebtAdjustmentRepository;
  protected uniqueFields: (keyof PartnerDebtAdjustment)[] = ["code"];
  protected uniqueScope?: (keyof PartnerDebtAdjustment)[] = ["storeId"];
  protected searchableFields = ["code"];

  constructor(
    @inject(PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRepository)
    repository: PartnerDebtAdjustmentRepository,
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
    data: DeepPartial<PartnerDebtAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.partnerId) {
      data.partnerSnapshot = await this.partnerRepository.getSnapshot(
        data.partnerId,
        manager,
      );
    }
    if (data.invoiceId) {
      data.invoiceSnapshot = await this.invoiceRepository.getSnapshot(
        data.invoiceId,
        manager,
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<PartnerDebtAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.partnerId !== undefined) {
      data.partnerSnapshot = data.partnerId
        ? await this.partnerRepository.getSnapshot(data.partnerId, manager)
        : null;
    }
    if (data.invoiceId !== undefined) {
      data.invoiceSnapshot = data.invoiceId
        ? await this.invoiceRepository.getSnapshot(data.invoiceId, manager)
        : null;
    }
  }

  async actionAfterCreate(
    data: PartnerDebtAdjustment,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.partnerDebtSync.syncForAdjustment(data, manager);
    await this.recalculateInvoice(data.invoiceId, manager);
  }

  async actionAfterUpdate(
    data: PartnerDebtAdjustment,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.partnerDebtSync.syncForAdjustment(data, manager);
    await this.recalculateInvoice(data.invoiceId, manager);
  }

  async actionAfterDelete(
    data: PartnerDebtAdjustment,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.partnerDebtSync.removeByRef(
      manager,
      PartnerDebtRefTypeEnum.ADJUSTMENT,
      data.id,
    );
    await this.recalculateInvoice(data.invoiceId, manager);
  }

  /** Tính lại nợ đã trả / còn lại của hóa đơn bị điều chỉnh. */
  private async recalculateInvoice(
    invoiceId: string | null | undefined,
    manager: EntityManager,
  ): Promise<void> {
    if (!invoiceId) return;
    await this.invoiceService.recalculatePaidAmounts(invoiceId, manager);
  }
}
