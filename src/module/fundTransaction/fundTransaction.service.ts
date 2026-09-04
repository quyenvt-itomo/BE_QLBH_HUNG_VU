import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { FundTransaction, FundTransactionRefType } from "@/database/models/FundTransaction";
import { FundAdjustment } from "@/database/models/FundAdjustment";
import { FundTransfer } from "@/database/models/FundTransfer";
import { IncomeExpense, IncomeExpenseType } from "@/database/models/store/IncomeExpense";
import { Fund } from "@/database/models/Fund";
import DatabaseConfig from "@/config/database";
import { BaseService } from "@/shared/base/BaseService";
import { TransactionType } from "@/shared/constants/enum";
import logger from "@/shared/utils/logger";
import { FundTransactionRepository } from "./fundTransaction.repository";
import { FUND_TRANSACTION_TYPES } from "./fundTransaction.types";
@injectable()
export class FundTransactionService extends BaseService<FundTransaction> {
  protected repository: FundTransactionRepository;

  constructor(
    @inject(FUND_TRANSACTION_TYPES.Repository)
    repository: FundTransactionRepository,
  ) {
    super();
    this.repository = repository;
  }

  /**
   * Gắn số dư hiện tại vào danh sách quỹ.
   *
   * fund_transactions là sổ giao dịch chuẩn hóa. Trong giai đoạn chuyển đổi,
   * một số dữ liệu cũ có thể chưa có bản ghi ở bảng này, nên các bản ghi nguồn
   * tương ứng cũng được đọc bổ sung. Bản ghi nào đã có transaction tham chiếu
   * sẽ không bị cộng lại.
   */
  async enrichFundsWithBalance(
    funds: Fund[],
    offsetAt = new Date(),
    manager?: EntityManager,
  ): Promise<Fund[]> {
    if (!funds.length) return funds;

    try {
      const mainManager = manager || DatabaseConfig.manager;
      const fundIds = funds.map((fund) => fund.id);
      const representedRefs = new Set<string>();
      const balances = new Map(fundIds.map((id) => [id, 0]));
      const refKey = (refType: string, refId: string) => `${refType}:${refId}`;

      const transactions = await mainManager
        .getRepository(FundTransaction)
        .createQueryBuilder("tx")
        .where("tx.fundId IN (:...fundIds)", { fundIds })
        .andWhere("tx.occurredAt <= :offsetAt", { offsetAt })
        .andWhere("tx.deletedAt IS NULL")
        .getMany();

      for (const transaction of transactions) {
        representedRefs.add(refKey(transaction.refType, transaction.refId));
        const sign = transaction.type === TransactionType.IN ? 1 : -1;
        balances.set(
          transaction.fundId,
          (balances.get(transaction.fundId) || 0) + sign * Number(transaction.amount || 0),
        );
      }

      const adjustments = await mainManager
        .getRepository(FundAdjustment)
        .createQueryBuilder("adjustment")
        .where("adjustment.fundId IN (:...fundIds)", { fundIds })
        .andWhere("adjustment.occurredAt <= :offsetAt", { offsetAt })
        .andWhere("adjustment.deletedAt IS NULL")
        .getMany();

      for (const adjustment of adjustments) {
        if (representedRefs.has(refKey(FundTransactionRefType.ADJUSTMENT, adjustment.id))) {
          continue;
        }
        if (adjustment.fundId) {
          balances.set(
            adjustment.fundId,
            (balances.get(adjustment.fundId) || 0) + Number(adjustment.deltaAmount || 0),
          );
        }
      }

      const incomeExpenses = await mainManager
        .getRepository(IncomeExpense)
        .createQueryBuilder("incomeExpense")
        .where("incomeExpense.fundId IN (:...fundIds)", { fundIds })
        .andWhere("incomeExpense.occurredAt <= :offsetAt", { offsetAt })
        .andWhere("incomeExpense.deletedAt IS NULL")
        .getMany();

      for (const incomeExpense of incomeExpenses) {
        if (
          representedRefs.has(
            refKey(
              incomeExpense.type === IncomeExpenseType.INCOME
                ? FundTransactionRefType.INCOME
                : FundTransactionRefType.EXPENSE,
              incomeExpense.id,
            ),
          )
        ) {
          continue;
        }
        if (incomeExpense.fundId) {
          const sign = incomeExpense.type === IncomeExpenseType.INCOME ? 1 : -1;
          balances.set(
            incomeExpense.fundId,
            (balances.get(incomeExpense.fundId) || 0) + sign * Number(incomeExpense.amount || 0),
          );
        }
      }

      const transfers = await mainManager
        .getRepository(FundTransfer)
        .createQueryBuilder("transfer")
        .where(
          "(transfer.fromFundId IN (:...fundIds) OR transfer.toFundId IN (:...fundIds))",
          { fundIds },
        )
        .andWhere("transfer.occurredAt <= :offsetAt", { offsetAt })
        .andWhere("transfer.deletedAt IS NULL")
        .getMany();

      for (const transfer of transfers) {
        if (representedRefs.has(refKey(FundTransactionRefType.TRANSFER, transfer.id))) {
          continue;
        }

        const amount = Number(transfer.amount || 0);
        if (balances.has(transfer.fromFundId)) {
          balances.set(
            transfer.fromFundId,
            (balances.get(transfer.fromFundId) || 0) - amount,
          );
        }
        if (balances.has(transfer.toFundId)) {
          balances.set(
            transfer.toFundId,
            (balances.get(transfer.toFundId) || 0) + amount,
          );
        }
      }

      funds.forEach((fund) => {
        fund.currentBalance = balances.get(fund.id) || 0;
      });

      return funds;
    } catch (error) {
      logger.error("FundTransactionService::enrichFundsWithBalance -> ", error);
      funds.forEach((fund) => {
        fund.currentBalance = fund.currentBalance || 0;
      });
      return funds;
    }
  }

  async validateBeforeCreate(_data?: DeepPartial<FundTransaction>): Promise<void> {
    throw new Error("fundTransaction.generated_only");
  }

  async validateBeforeUpdate(): Promise<void> {
    throw new Error("fundTransaction.immutable");
  }

  async validateBeforeDelete(): Promise<void> {
    throw new Error("fundTransaction.immutable");
  }
}
