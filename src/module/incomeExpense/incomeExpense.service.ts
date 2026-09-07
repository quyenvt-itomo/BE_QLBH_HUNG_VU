import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import {
  IncomeExpense,
  IncomeExpenseStatus,
  IncomeExpenseType,
} from "@/database/models/store/IncomeExpense";
import { Order, OrderStatus } from "@/database/models/store/Order";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { generateCode } from "@/shared/utils/code.utils";
import { FUND_TYPES } from "../fund/fund.types";
import { FundRepository } from "../fund/fund.repository";
import { PARTNER_TYPES } from "../partner/partner.types";
import { PartnerRepository } from "../partner/partner.repository";
import { ATTRIBUTE_TYPES } from "../attribute/attribute.types";
import { AttributeRepository } from "../attribute/attribute.repository";
import { IncomeExpenseRepository } from "./incomeExpense.repository";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { DEBT_TYPES } from "../debt/debt.types";
import { DebtRecalculateService } from "../debt/debt.recalculate.service";
@injectable()
export class IncomeExpenseService extends BaseService<IncomeExpense> {
  protected repository: IncomeExpenseRepository;
  protected uniqueFields: (keyof IncomeExpense)[] = ["code"];
  protected uniqueScope: (keyof IncomeExpense)[] = ["storeId"];
  protected searchableFields = ["code", "description"];
  constructor(
    @inject(INCOME_EXPENSE_TYPES.Repository) repository: IncomeExpenseRepository,
    @inject(FUND_TYPES.Repository) private fundRepository: FundRepository,
    @inject(PARTNER_TYPES.PartnerRepository) private partnerRepository: PartnerRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository) private attributeRepository: AttributeRepository,
    @inject(DEBT_TYPES.DebtRecalculateService)
    private debtService: DebtRecalculateService,
  ) { super(); this.repository = repository; }

  protected async attachActions(
    entity: IncomeExpense & { _actions?: any },
  ): Promise<void> {
    entity._actions = {
      ...this.getDefaultAction(),
      delete: { can: !entity.orderId },
    };
  }

  async validateBeforeCreate(
    data: DeepPartial<IncomeExpense>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    data.storeId = data.storeId || req?.storeContext?.storeId;
    if (!data.storeId) throw new Error("store.required");
    if (!data.code) data.code = await generateCode("incomeExpense", data.storeId);
    if (!data.type) throw new Error("incomeExpense.type.required");
    if (
      ![IncomeExpenseType.INCOME, IncomeExpenseType.EXPENSE].includes(data.type)
    )
      throw new Error("incomeExpense.type.invalid");
    data.occurredAt = data.occurredAt || new Date();
    if (data.orderId) {
      const order = await manager.getRepository(Order).findOne({
        where: { id: data.orderId, deletedAt: null } as any,
      });
      if (!order) throw new Error("order.not_found");
      data.status = this.getStatusForOrder(order.status);
    } else {
      data.status = IncomeExpenseStatus.COMPLETED;
    }
    await this.fundRepository.attachInfo(data, manager);
    await this.partnerRepository.attachInfo(data, manager);
    if (data.categoryId) {
      await this.attributeRepository.attachInfo(data as any, manager);
      if (!data.categorySnapshot) throw new Error("category.not_found");
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<IncomeExpense>,
    manager: EntityManager,
  ): Promise<void> {
    const current = await this.repository.findById(id, manager);
    if (!current) throw new Error("incomeExpense.not_found");

    if (data.orderId !== undefined && data.orderId !== current.orderId) {
      throw new Error("incomeExpense.order_locked");
    }
    if (current.orderId) {
      this.assertOrderLinkedFieldsUnchanged(current, data);
      if (data.type !== undefined && data.type !== current.type) {
        throw new Error("incomeExpense.order_type_locked");
      }
      if (data.status !== undefined && data.status !== current.status) {
        throw new Error("incomeExpense.order_status_locked");
      }
    } else if (data.status !== undefined) {
      throw new Error("incomeExpense.status_managed");
    }

    if (data.fundId !== undefined) {
      await this.fundRepository.attachInfo(data, manager);
    }
    if (data.partnerId !== undefined) {
      await this.partnerRepository.attachInfo(data, manager);
    }
    if (data.categoryId !== undefined) {
      data.categorySnapshot = null;
      if (data.categoryId) {
        await this.attributeRepository.attachInfo(data as any, manager);
        if (!data.categorySnapshot) throw new Error("category.not_found");
      }
    }
  }

  async validateBeforeDelete(data: IncomeExpense): Promise<void> {
    if (data.orderId) throw new Error("incomeExpense.order_delete_forbidden");
  }

  async actionAfterCreate(data: IncomeExpense, manager: EntityManager): Promise<void> {
    await this.debtService.syncForIncomeExpense(data, manager);
  }

  async actionAfterUpdate(data: IncomeExpense, manager: EntityManager): Promise<void> {
    await this.debtService.syncForIncomeExpense(data, manager);
  }

  async actionAfterDelete(data: IncomeExpense, manager: EntityManager): Promise<void> {
    await this.debtService.removeIncomeExpenseReferences(data.id, manager);
  }

  private getStatusForOrder(status: OrderStatus): IncomeExpenseStatus {
    if (status === OrderStatus.COMPLETED) return IncomeExpenseStatus.COMPLETED;
    if (status === OrderStatus.CANCELED) return IncomeExpenseStatus.CANCELED;
    return IncomeExpenseStatus.DRAFT;
  }

  private assertOrderLinkedFieldsUnchanged(
    current: IncomeExpense,
    data: DeepPartial<IncomeExpense>,
  ): void {
    if (
      data.partnerId !== undefined &&
      (data.partnerId || null) !== (current.partnerId || null)
    ) {
      throw new Error("incomeExpense.order_partner_locked");
    }
    if (
      data.categoryId !== undefined &&
      (data.categoryId || null) !== (current.categoryId || null)
    ) {
      throw new Error("incomeExpense.order_category_locked");
    }
    if (
      data.description !== undefined &&
      (data.description || null) !== (current.description || null)
    ) {
      throw new Error("incomeExpense.order_description_locked");
    }
    if (data.occurredAt !== undefined) {
      const currentTime = current.occurredAt?.getTime?.() ?? new Date(current.occurredAt).getTime();
      const nextTime = new Date(data.occurredAt as Date).getTime();
      if (currentTime !== nextTime) {
        throw new Error("incomeExpense.order_occurred_at_locked");
      }
    }
  }
}
