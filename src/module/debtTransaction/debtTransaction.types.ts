export const DEBT_TRANSACTION_TYPES = {
  Repository: Symbol.for("DebtTransactionRepository"),
  Service: Symbol.for("DebtTransactionService"),
  Controller: Symbol.for("DebtTransactionController"),
  Router: Symbol.for("DebtTransactionRouter"),
} as const;
