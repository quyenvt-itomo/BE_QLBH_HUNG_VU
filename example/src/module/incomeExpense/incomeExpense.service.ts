import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { IncomeExpenseRepository } from "./incomeExpense.repository";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { IncomeExpense } from "@/database/models/company/IncomeExpense";
import { DeepPartial, EntityManager } from "typeorm";
import {
  PARTNER_DEBT_SYNC_TYPES,
  PartnerDebtSyncService,
} from "@/module/partnerDebtSync";
import { VAT_DEBT_SYNC_TYPES, VatDebtSyncService } from "@/module/vatDebtSync";
import { InvoiceAllocation } from "@/database/models/company/InvoiceAllocation";
import {
  INVOICE_TYPES,
  InvoiceRepository,
  InvoiceService,
} from "@/module/invoice";
import { PartnerDebtRefTypeEnum } from "@/database/models/company/PartnerDebtTransaction";
import { VatTransactionType } from "@/database/models/company/VatDebtTransaction";

@injectable()
export class IncomeExpenseService extends BaseService<IncomeExpense> {
  protected repository: IncomeExpenseRepository;
  protected uniqueFields: (keyof IncomeExpense)[] = ["code"];
  protected uniqueScope?: (keyof IncomeExpense)[] = ["companyId"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof IncomeExpense = "occurredAt";

  constructor(
    @inject(INCOME_EXPENSE_TYPES.IncomeExpenseRepository)
    repository: IncomeExpenseRepository,
    @inject(PARTNER_DEBT_SYNC_TYPES.PartnerDebtSyncService)
    private partnerDebtSync: PartnerDebtSyncService,
    @inject(VAT_DEBT_SYNC_TYPES.VatDebtSyncService)
    private vatDebtSync: VatDebtSyncService,
    @inject(INVOICE_TYPES.InvoiceRepository)
    private invoiceRepository: InvoiceRepository,
    @inject(INVOICE_TYPES.InvoiceService)
    private invoiceService: InvoiceService,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<IncomeExpense>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.populateAllocationSnapshots(data, manager, undefined);
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<IncomeExpense>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.populateAllocationSnapshots(data, manager, id);
    // repo.update không cascade relation -> thay thế allocation thủ công nếu FE gửi lại danh sách
    if (data.invoiceAllocations !== undefined) {
      await manager
        .getRepository(InvoiceAllocation)
        .delete({ incomeExpenseId: id } as any);
      const allocs = ((data.invoiceAllocations as any[]) || []).map((a) => ({
        ...a,
        incomeExpenseId: id,
      }));
      if (allocs.length) {
        await manager.getRepository(InvoiceAllocation).save(allocs);
      }
    }
  }

  /** Đảm bảo mỗi allocation có invoiceSnapshot (để suy ra side của hóa đơn). */
  private async populateAllocationSnapshots(
    data: DeepPartial<IncomeExpense>,
    manager: EntityManager,
    incomeExpenseId?: string,
  ): Promise<void> {
    const allocations = (data.invoiceAllocations || []) as any[];
    for (const al of allocations) {
      if (!al.invoiceId) continue;
      al.incomeExpenseId = (incomeExpenseId as string) || undefined;
      al.allocatedAt = al.allocatedAt || data.occurredAt || new Date();
      if (!al.invoiceSnapshot) {
        al.invoiceSnapshot = await this.invoiceRepository.getSnapshot(
          al.invoiceId,
          manager,
        );
      }
    }
  }

  async actionAfterCreate(
    data: IncomeExpense,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.partnerDebtSync.syncForIncomeExpense(
      data,
      data.invoiceAllocations || [],
      manager,
    );
    await this.vatDebtSync.syncForIncomeExpense(data, manager);
    await this.recalculateAllocatedInvoices(
      data.invoiceAllocations || [],
      manager,
    );
  }

  async actionAfterUpdate(
    data: IncomeExpense,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const allocations = await manager
      .getRepository(InvoiceAllocation)
      .find({ where: { incomeExpenseId: data.id } as any });
    await this.partnerDebtSync.syncForIncomeExpense(data, allocations, manager);
    await this.vatDebtSync.syncForIncomeExpense(data, manager);
    await this.recalculateAllocatedInvoices(allocations, manager);
  }

  async actionAfterDelete(
    data: IncomeExpense,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const allocations = await manager
      .getRepository(InvoiceAllocation)
      .find({ where: { incomeExpenseId: data.id } as any });
    await this.partnerDebtSync.removeByRef(
      manager,
      PartnerDebtRefTypeEnum.PAYMENT,
      data.id,
    );
    await this.vatDebtSync.removeByRef(
      manager,
      VatTransactionType.EXPENSE,
      data.id,
    );
    await this.recalculateAllocatedInvoices(allocations, manager);
  }

  /** Tính lại nợ đã trả / còn lại cho các hóa đơn được phân bổ. */
  private async recalculateAllocatedInvoices(
    allocations: InvoiceAllocation[],
    manager: EntityManager,
  ): Promise<void> {
    const invoiceIds = Array.from(
      new Set(
        (allocations || [])
          .map((a) => a.invoiceId)
          .filter((id): id is string => !!id),
      ),
    );
    for (const invoiceId of invoiceIds) {
      await this.invoiceService.recalculatePaidAmounts(invoiceId, manager);
    }
  }
}
