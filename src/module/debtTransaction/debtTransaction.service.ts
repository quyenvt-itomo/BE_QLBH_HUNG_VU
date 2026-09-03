import { inject, injectable } from "inversify";
import { DeepPartial } from "typeorm";
import { DebtTransaction } from "@/database/models/DebtTransaction";
import { BaseService } from "@/shared/base/BaseService";
import { DebtTransactionRepository } from "./debtTransaction.repository";
import { DEBT_TRANSACTION_TYPES } from "./debtTransaction.types";

@injectable()
export class DebtTransactionService extends BaseService<DebtTransaction> {
  protected repository: DebtTransactionRepository;

  constructor(
    @inject(DEBT_TRANSACTION_TYPES.Repository)
    repository: DebtTransactionRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    _data: DeepPartial<DebtTransaction>,
  ): Promise<void> {
    throw new Error("debtTransaction.generated_only");
  }

  async validateBeforeUpdate(): Promise<void> {
    throw new Error("debtTransaction.immutable");
  }

  async validateBeforeDelete(): Promise<void> {
    throw new Error("debtTransaction.immutable");
  }
}
