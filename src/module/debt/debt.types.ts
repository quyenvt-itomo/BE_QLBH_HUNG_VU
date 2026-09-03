export const DEBT_TYPES = {
  DebtService: Symbol.for("DebtService"),
  DebtController: Symbol.for("DebtController"),
  DebtRecalculateService: Symbol.for("DebtRecalculateService"),
  DebtRouter: Symbol.for("DebtRouter"),

  // Alias giữ tương thích với các module đang dùng convention ngắn.
  Service: Symbol.for("DebtService"),
  Controller: Symbol.for("DebtController"),
  RecalculateService: Symbol.for("DebtRecalculateService"),
  Router: Symbol.for("DebtRouter"),
} as const;
