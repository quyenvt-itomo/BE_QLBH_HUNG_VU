import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { IncomeExpense, IncomeExpenseType } from "@/database/models/store/IncomeExpense";
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
    await this.fundRepository.attachInfo(data, manager);
    await this.partnerRepository.attachInfo(data, manager);
    if (data.categoryId) {
      await this.attributeRepository.attachInfo(data as any, manager);
      if (!data.categorySnapshot) throw new Error("category.not_found");
    }
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
}
