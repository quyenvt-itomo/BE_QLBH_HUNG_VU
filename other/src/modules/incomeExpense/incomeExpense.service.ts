import { injectable, inject } from "inversify";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { IncomeExpenseRepository } from "./incomeExpense.repository";
import {
  IncomeExpenseRelations,
  IncomeExpenseSelectFull,
} from "./incomeExpense.select";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { BaseService } from "@/shared/base/BaseService";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import {
  PARTNER_DEBT_TYPES,
  PartnerDebtRecalculateService,
} from "../partnerDebt";
import {
  FUND_TRANSACTION_TYPES,
  FundTransactionRecalculate,
} from "@/modules/fundTransaction";
import { VAT_DEBT_TYPES, VatDebtRecalculateService } from "../vatDebt";
import { PARTNER_TYPES, PartnerRepository } from "../partner";
import { EMPLOYEE_TYPES, EmployeeRepository } from "../employee";
import { FilterItem } from "@/shared/types/interfaces";
import { IncomeExpenseQueryDto } from "./incomeExpense.validator";
import {
  AttributeTypeEnum,
  INCOME_SALE_CATEGORY_NAME,
  OrderTypeEnum,
} from "@/shared/constants/enum";
import { FUND_CATEGORY_TYPES, FundCategoryRepository } from "../fundCategory";
import { ORDER_TYPES } from "../order/order.types";
import { OrderRepository } from "../order/order.repository";
import { BadRequestError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";
import { FUND_TYPES } from "../fund/fund.types";
import { FundRepository } from "../fund/fund.repository";

@injectable()
export class IncomeExpenseService extends BaseService<IncomeExpense> {
  protected repository: IncomeExpenseRepository;
  protected findOptions = {};
  protected relations = IncomeExpenseRelations;
  protected selectedFields = IncomeExpenseSelectFull;
  protected uniqueFields: (keyof IncomeExpense)[] = ["code"];
  protected searchableFields = [
    "code",
    "description",
    "creatorSnapshot.name",
    "createrSnapshot.code",
    "partnerSnapshot.name",
    "partnerSnapshot.code",
    "fund.name",
  ];
  protected timeField: keyof IncomeExpense = "occurredAt";

  constructor(
    @inject(INCOME_EXPENSE_TYPES.IncomeExpenseRepository)
    repository: IncomeExpenseRepository,
    @inject(FUND_CATEGORY_TYPES.FundCategoryRepository)
    private fundCategoryRepository: FundCategoryRepository,
    @inject(ORDER_TYPES.OrderRepository)
    private orderRepository: OrderRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(FUND_TYPES.FundRepository)
    private fundRepository: FundRepository,
    @inject(FUND_TRANSACTION_TYPES.FundTransactionRecalculate)
    private fundTransactionRecalculate: FundTransactionRecalculate,
    @inject(PARTNER_DEBT_TYPES.PartnerDebtRecalculateService)
    private partnerDebtRecalculate: PartnerDebtRecalculateService,
    @inject(VAT_DEBT_TYPES.VatDebtRecalculateService)
    private vatDebtRecalculate: VatDebtRecalculateService,
  ) {
    super();
    this.repository = repository;
  }

  private async validateFundBelongsStore(
    fundId: string | undefined,
    storeId: string | undefined,
  ): Promise<void> {
    if (!fundId || !storeId) return;

    const fund = await this.fundRepository.findOne({
      where: { id: fundId } as any,
      select: {
        id: true,
        storeId: true,
      } as any,
    });

    if (!fund) {
      throw new BadRequestError("Quỹ không tồn tại", {
        field: "fundId",
        code: ErrorsMessages.not_found,
      });
    }

    if ((fund as any).storeId !== storeId) {
      throw new BadRequestError("Quỹ không thuộc cửa hàng đã chọn", {
        field: "fundId",
        code: ErrorsMessages.invalid,
      });
    }
  }

  async getFilterItemsAndTotal(query: IncomeExpenseQueryDto): Promise<{
    totalIncome: number;
    totalExpense: number;
    filterItems: FilterItem[];
  }> {
    const filterItems = await this.repository.getFilterItems(query);

    let totalIncome = 0;
    let totalExpense = 0;

    filterItems.forEach((item) => {
      if (item.parentId) return;

      if (item.type === AttributeTypeEnum.INCOME_CATEGORY) {
        totalIncome += item.value || 0;
      } else if (item.type === AttributeTypeEnum.EXPENSE_CATEGORY) {
        totalExpense += item.value || 0;
      }
    });

    return {
      totalIncome,
      totalExpense,
      filterItems,
    };
  }

  async validateBeforeCreate(
    data: DeepPartial<IncomeExpense>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (data.orderId) {
      const order = await this.orderRepository.findById(data.orderId);
      if (order?.type !== OrderTypeEnum.SALE) {
        throw new BadRequestError(
          "Đơn hàng không hợp lệ, chỉ được phép chọn đơn bán hàng",
          {
            field: "orderId",
            code: ErrorsMessages.invalid,
          },
        );
      }
      const category = await this.fundCategoryRepository.findOne({
        where: { name: INCOME_SALE_CATEGORY_NAME },
      });
      data.categoryId = category?.id;
      data.partnerId = order?.partnerId;
      data.description = `Thanh toán cho đơn hàng ${order.code}`;
      data.creatorId = order?.employeeId;
      data.storeId = order?.storeId;
    }

    if (!data.storeId) {
      throw new BadRequestError("Thiếu cửa hàng", {
        field: "storeId",
        code: ErrorsMessages.required,
      });
    }

    await this.validateFundBelongsStore(data.fundId, data.storeId);

    // Nạp các snapshot cần thiết
    if (data.partnerId) {
      const partnerSnapshot = await this.partnerRepository.getPartnerSnapshot(
        data.partnerId,
      );
      data.partnerSnapshot = partnerSnapshot;
    }

    if (data.creatorId) {
      const creatorSnapshot = await this.employeeRepository.getEmployeeSnapshot(
        data.creatorId,
      );
      data.creatorSnapshot = creatorSnapshot;
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<IncomeExpense>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const current = await this.findById(id);
    const storeId = data.storeId ?? current?.storeId;
    const fundId = data.fundId ?? current?.fundId;

    if (!storeId) {
      throw new BadRequestError("Thiếu cửa hàng", {
        field: "storeId",
        code: ErrorsMessages.required,
      });
    }

    await this.validateFundBelongsStore(fundId, storeId);

    // Nạp các snapshot cần thiết
    if (data.partnerId) {
      const partnerSnapshot = await this.partnerRepository.getPartnerSnapshot(
        data.partnerId,
      );
      data.partnerSnapshot = partnerSnapshot;
    }

    if (data.creatorId) {
      const creatorSnapshot = await this.employeeRepository.getEmployeeSnapshot(
        data.creatorId,
      );
      data.creatorSnapshot = creatorSnapshot;
    }
  }

  async handleAfterChangedData(
    data: IncomeExpense,
    manager: EntityManager,
  ): Promise<void> {
    const oldData = await this.findById(data.id);

    const fromDate = this.getEarliestDate(data.occurredAt, oldData?.occurredAt);

    const fundIds = this.collectUniqueIds([data.fundId, oldData?.fundId]);
    const partnerIds = this.collectUniqueIds([
      data.partnerId,
      oldData?.partnerId,
    ]);

    await this.fundTransactionRecalculate.recalculateFromDate(
      fromDate,
      manager,
      fundIds,
    );

    await this.partnerDebtRecalculate.recalculateFromDate(
      data.storeId,
      fromDate,
      manager,
      partnerIds,
    );

    await this.vatDebtRecalculate.recalculateFromDate(
      data.storeId,
      fromDate,
      manager,
    );
  }

  async actionAfterCreate(
    data: IncomeExpense,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterUpdate(
    data: IncomeExpense,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterDelete(
    data: IncomeExpense,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }
}
