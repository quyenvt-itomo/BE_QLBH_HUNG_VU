import { inject, injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { DebtTransaction } from "@/database/models/DebtTransaction";
import { DebtTransactionService } from "./debtTransaction.service";
import { DEBT_TRANSACTION_TYPES } from "./debtTransaction.types";

@injectable()
export class DebtTransactionController extends BaseController<DebtTransaction> {
  protected service: DebtTransactionService;

  constructor(
    @inject(DEBT_TRANSACTION_TYPES.Service)
    service: DebtTransactionService,
  ) {
    super();
    this.service = service;
  }
}
