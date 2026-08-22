import { inject, injectable } from "inversify";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { BaseService } from "@/shared/base/BaseService";
import { Shift } from "@/database/models/store/Shift";
import { ShiftRepository } from "./shift.repository";
import { SHIFT_TYPES, ShiftSummary } from "./shift.types";
import { ShiftStatusEnum } from "@/shared/constants/enum";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "@/shared/types/errors";
import { CloseShiftDto, CreateShiftDto, OpenShiftDto } from "./shift.validator";
import { withTransaction } from "@/shared/base/TransactionManager";
import { ORDER_TYPES } from "../order/order.types";
import { OrderRepository } from "../order/order.repository";
import { INCOME_EXPENSE_TYPES } from "../incomeExpense/incomeExpense.types";
import { IncomeExpenseRepository } from "../incomeExpense/incomeExpense.repository";
import { USER_TYPES } from "../user/user.types";
import { UserRepository } from "../user/user.repository";

@injectable()
export class ShiftService extends BaseService<Shift> {
  protected repository: ShiftRepository;
  protected searchableFields = [
    "code",
    "note",
    "createdBySnapshot.name",
    "updatedBySnapshot.name",
    "store.name",
  ];
  protected timeField: keyof Shift & string = "startAt";

  protected summaryFields?: (keyof Shift)[] = [
    "totalSaleOrder",
    "totalSaleReturnOrder",
    "totalRevenue",
    "totalDebtAmount",
    "totalCashInFromOrders",
    "totalCashIn",
    "totalCashOut",
  ];

  constructor(
    @inject(SHIFT_TYPES.ShiftRepository)
    repository: ShiftRepository,
    @inject(ORDER_TYPES.OrderRepository)
    private orderRepository: OrderRepository,
    @inject(INCOME_EXPENSE_TYPES.IncomeExpenseRepository)
    private incomeExpenseRepository: IncomeExpenseRepository,
    @inject(USER_TYPES.UserRepository)
    private userRepository: UserRepository,
  ) {
    super();
    this.repository = repository;
  }

  async getShiftSummary(id: string, req?: Request): Promise<ShiftSummary> {
    const shift = await this.repository.findById(id, undefined, req);
    if (!shift) {
      throw new BadRequestError("Không tìm thấy dữ liệu ca làm việc");
    }

    const { storeId, startAt, endAt, openingCash } = shift;

    const orderSummary = await this.orderRepository.aggregateShiftSummary(
      storeId,
      startAt,
      endAt,
      req,
    );

    const incomeExpenseSummary =
      await this.incomeExpenseRepository.aggregateShiftSummary(
        storeId,
        startAt,
        endAt,
        req,
      );

    return {
      shift,

      totalRevenue: orderSummary.totalRevenue,
      totalSaleOrder: orderSummary.totalSaleOrder,
      totalSaleReturnOrder: orderSummary.totalSaleReturnOrder,
      totalDebtAmount:
        orderSummary.totalRevenue -
        orderSummary.totalLoyaltyDiscount -
        incomeExpenseSummary.totalIncomeFromOrders,

      totalCashInFromOrders: incomeExpenseSummary.totalCashIncomeFromOrders,
      totalCashIn: incomeExpenseSummary.totalCashIncomeWithoutOrders,
      totalCashOut: incomeExpenseSummary.totalCashExpenseWithoutOrders,
      expectedCash:
        openingCash +
        incomeExpenseSummary.totalCashIncomeFromOrders +
        incomeExpenseSummary.totalCashIncomeWithoutOrders -
        incomeExpenseSummary.totalCashExpenseWithoutOrders,
    };
  }

  async validateBeforeCreate(
    data: DeepPartial<Shift>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { userId } = data as CreateShiftDto;
    delete (data as CreateShiftDto).userId; // tránh lưu userId vào db, chỉ dùng để validate

    if (userId) {
      const userSnapshot = await this.userRepository.getSnapshot(
        userId,
        manager,
      );

      if (userSnapshot) {
        data.createdBy = userId;
        data.createdBySnapshot = userSnapshot;
      }
    }

    if (data.createdBy) {
      const existingShift = await this.repository.getUserCurrentShift(
        data.createdBy,
        data.storeId,
      );

      if (existingShift) {
        throw new BadRequestError(
          "Nhân viên này đã có một ca làm việc đang mở tại cửa hàng. Vui lòng đóng ca hiện tại trước khi mở ca mới.",
        );
      }
    }

    data.status = ShiftStatusEnum.ACTIVE;
    data.endAt = null;
    data.closingCash = null;
    data.closingCashSnapshot = null;
    data.expectedCash = null;
    data.difference = null;
    data.closingChecklist = null;

    if (data.openingCash == null || Number(data.openingCash) < 0) {
      throw new BadRequestError("Số tiền đầu ca không hợp lệ");
    }

    if (!data.startAt) {
      data.startAt = new Date();
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<Shift>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const existing = await this.repository.findById(id, manager);
    if (!existing) {
      throw new BadRequestError("Ca làm việc không tồn tại");
    }

    const hasCloseFields =
      data.endAt !== undefined ||
      data.closingCash !== undefined ||
      data.closingCashSnapshot !== undefined ||
      data.expectedCash !== undefined ||
      data.difference !== undefined ||
      data.closingChecklist !== undefined ||
      data.status === ShiftStatusEnum.CLOSED;

    if (hasCloseFields) {
      throw new BadRequestError(
        "Không thể cập nhật thông tin đóng ca bằng endpoint update. Vui lòng dùng nghiệp vụ đóng ca",
      );
    }

    if (existing.status === ShiftStatusEnum.CLOSED) {
      throw new BadRequestError("Ca đã đóng, không thể cập nhật");
    }
  }

  async openShift(
    data: OpenShiftDto,
    manager?: EntityManager,
    req?: Request,
  ): Promise<Shift> {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedError("User chưa đăng nhập");
    }

    const store = req?.store;
    if (!store) {
      throw new BadRequestError("Phải bắt đầu ca trong một cửa hàng cụ thể");
    }

    // Kiểm tra xem user đã có ca nào đang mở chưa, nếu có thì không cho mở ca mới
    const existingShift = await this.repository.getUserCurrentShift(
      userId,
      store.id,
    );

    if (existingShift) {
      throw new BadRequestError(
        "Bạn đã có một ca làm việc đang mở tại cửa hàng. Vui lòng đóng ca hiện tại trước khi mở ca mới.",
      );
    }

    const userContext = req?.userContext;
    const newShitfData: DeepPartial<Shift> = {
      ...data,
      storeId: store.id,
      createdBy: userId,
      createdBySnapshot: userContext?.userSnapshot || null,
    };
    return this.create(newShitfData, manager, req);
  }

  async closeShift(
    id: string,
    payload: CloseShiftDto,
    req?: Request,
  ): Promise<Shift> {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedError("User chưa đăng nhập");
    }

    return withTransaction(async (trxManager) => {
      const existing = await this.repository.findById(id, trxManager);
      if (!existing) {
        throw new BadRequestError("Ca làm việc không tồn tại");
      }

      const store = req?.store;

      if (store && existing.storeId !== store.id) {
        throw new BadRequestError("Không thể đóng ca của cửa hàng khác");
      }

      if (existing.createdBy !== userId) {
        throw new BadRequestError("Chỉ người tạo ca mới được đóng ca này");
      }

      if (existing.status === ShiftStatusEnum.CLOSED) {
        throw new BadRequestError("Ca này đã được đóng trước đó");
      }

      const endAt = new Date();
      if (endAt < existing.startAt) {
        throw new BadRequestError(
          "Thời gian đóng ca không được nhỏ hơn thời gian bắt đầu ca",
        );
      }

      const closingCash = Number(payload.closingCash || 0);
      const shiftSummary = await this.getShiftSummary(id, req);
      const expectedCash = shiftSummary.expectedCash || 0;
      const difference = closingCash - expectedCash;

      const updateData: Partial<Shift> = {
        endAt,
        totalSaleOrder: shiftSummary.totalSaleOrder,
        totalSaleReturnOrder: shiftSummary.totalSaleReturnOrder,
        totalRevenue: shiftSummary.totalRevenue,
        totalDebtAmount: shiftSummary.totalDebtAmount,
        totalCashInFromOrders: shiftSummary.totalCashInFromOrders,
        totalCashIn: shiftSummary.totalCashIn,
        totalCashOut: shiftSummary.totalCashOut,
        expectedCash,
        closingCash,
        closingCashSnapshot: payload.closingCashSnapshot || null,
        difference,
        closingChecklist: payload.closingChecklist || null,
        status: ShiftStatusEnum.CLOSED,
      };

      if (payload.note !== undefined) {
        updateData.note = payload.note;
      }

      if (req?.userContext?.userId) {
        updateData.updatedBy = req.userContext.userId;
      }
      if (req?.userContext?.userSnapshot) {
        updateData.updatedBySnapshot = req.userContext.userSnapshot;
      }

      await this.repository.update(id, updateData, trxManager);

      const closedShift = await this.repository.findById(id, trxManager);
      if (!closedShift) {
        throw new BadRequestError("Không thể tải lại dữ liệu ca sau khi đóng");
      }

      return closedShift;
    });
  }
}
