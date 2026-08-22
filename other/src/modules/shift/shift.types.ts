import { Shift } from "@/database/models/store/Shift";

export const SHIFT_TYPES = {
  ShiftService: Symbol.for("ShiftService"),
  ShiftController: Symbol.for("ShiftController"),
  ShiftRepository: Symbol.for("ShiftRepository"),
  ShiftRouter: Symbol.for("ShiftRouter"),
};

export interface ShiftSummary {
  shift: Shift; // Thông tin ca làm việc

  totalSaleOrder: number | null; // Tổng đơn hàng trong ca
  totalSaleReturnOrder: number | null; // Tổng đơn hoàn trả trong ca
  totalRevenue: number | null; // Tổng doanh thu trong ca (đã bao gồm đơn hoàn trả)
  totalDebtAmount: number | null; // Tổng tiền khách chưa thanh toán trong ca

  totalCashInFromOrders: number | null; // tổng tiền mặt thu vào từ đơn hàng trong ca (2)
  totalCashIn: number | null; // tổng tiền mặt thu vào trong ca (không theo đơn hàng) (3)
  totalCashOut: number | null; // tổng tiền mặt chi ra trong ca (không theo đơn hàng hoặc theo đơn nhập hàng) (4)
  expectedCash: number | null; // số tiền mặt dự kiến phải có khi ra ca = (1 + 2 + 3 - 4)
}
