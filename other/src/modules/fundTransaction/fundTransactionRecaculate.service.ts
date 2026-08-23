import { FundAdjustment } from "@/database/models/FundAdjustment";
import { FundSnapshot } from "@/database/models/FundSnapshot";
import { FundTransaction } from "@/database/models/FundTransaction";
import { FundTransfer } from "@/database/models/FundTransfer";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { TransactionService } from "@/shared/base/TransactionService";
import {
  FundTransactionRefTypeEnum,
  FundTransactionType,
  IncomeExpenseTypeEnum,
} from "@/shared/constants/enum";
import logger from "@/shared/utils/logger";
import { EntityManager } from "typeorm";

interface ReplayItem {
  type: "TRANSFER" | "INCOME_EXPENSE" | "ADJUSTMENT";
  occurredAt: Date;
  data: FundTransfer | IncomeExpense | FundAdjustment;
}

export class FundTransactionRecalculate extends TransactionService {
  constructor() {
    super();
  }

  private getTransactionDataByIncomeExpense(
    data: IncomeExpense,
  ): Partial<FundTransaction> {
    const type =
      data.type === IncomeExpenseTypeEnum.EXPENSE
        ? FundTransactionType.DECREASE
        : FundTransactionType.INCREASE;
    return {
      fundId: data.fundId,
      amount: data.amount,
      type,
      occurredAt: data.occurredAt,
      refType:
        data.type === IncomeExpenseTypeEnum.EXPENSE
          ? FundTransactionRefTypeEnum.EXPENSE
          : FundTransactionRefTypeEnum.INCOME,
      refId: data.id,
      refCode: data.code,
    };
  }

  private getTransactionDataByFundTransfer(
    data: FundTransfer,
  ): Partial<FundTransaction>[] {
    return [
      {
        fundId: data.fromFundId,
        refId: data.id,
        type: FundTransactionType.DECREASE,
        amount: data.amount,
        occurredAt: data.occurredAt,
        refType: FundTransactionRefTypeEnum.TRANSFER,
        refCode: data.code,
      },
      {
        fundId: data.toFundId,
        refId: data.id,
        type: FundTransactionType.INCREASE,
        amount: data.amount,
        occurredAt: data.occurredAt,
        refType: FundTransactionRefTypeEnum.TRANSFER,
        refCode: data.code,
      },
    ];
  }

  private getTransactionDataByAdjustment(
    data: FundAdjustment,
  ): Partial<FundTransaction> {
    return {
      fundId: data.fundId,
      amount: data.deltaAmount,
      type: data.direction,
      occurredAt: data.occurredAt,
      refType: FundTransactionRefTypeEnum.ADJUSTMENT,
      refId: data.id,
      refCode: data.code,
    };
  }

  async recalculateFromDate(
    fromDate: Date,
    manager?: EntityManager,
    fundIds?: string[],
  ) {
    const mainManager = manager || (await this.getManager());

    logger.info(
      `[FundTransactionRecalculate] Bắt đầu ghi lại từ ${fromDate.toISOString()} cho quỹ: ${
        fundIds && fundIds.length > 0 ? fundIds.join(", ") : "tất cả"
      }`,
    );

    // Xóa tất cả transaction >= fromDate cho các fund liên quan
    const transQb = mainManager
      .getRepository(FundTransaction)
      .createQueryBuilder()
      .delete()
      .where("occurredAt >= :fromDate", { fromDate });
    if (fundIds && fundIds.length > 0) {
      transQb.andWhere("fundId IN (:...fundIds)", { fundIds });
    }
    await transQb.execute();
    // console.log(
    //   `[FundTransactionRecalculate] Deleted ${deleteResult.affected || 0} transactions from ${fromDate.toISOString()} for funds: ${fundIds?.join(", ") || "all"}`,
    // );

    const snapshotQb = mainManager
      .getRepository(FundSnapshot)
      .createQueryBuilder()
      .delete()
      .where("snapshotAt >= :fromDate", { fromDate });
    if (fundIds && fundIds.length > 0) {
      snapshotQb.andWhere("fundId IN (:...fundIds)", { fundIds });
    }
    await snapshotQb.execute();

    const ieQB = mainManager
      .getRepository(IncomeExpense)
      .createQueryBuilder("ie")
      .where("ie.occurredAt >= :fromDate", { fromDate });
    if (fundIds && fundIds.length > 0) {
      ieQB.andWhere("ie.fundId IN (:...fundIds)", { fundIds });
    }

    const adjustmentQb = mainManager
      .getRepository(FundAdjustment)
      .createQueryBuilder("ad")
      .where("ad.occurredAt >= :fromDate", { fromDate });
    if (fundIds && fundIds.length > 0) {
      adjustmentQb.andWhere("ad.fundId IN (:...fundIds)", { fundIds });
    }

    const ftQb = mainManager
      .getRepository(FundTransfer)
      .createQueryBuilder("ft")
      .where("ft.occurredAt >= :fromDate", { fromDate });
    if (fundIds && fundIds.length > 0) {
      ftQb.andWhere(
        "(ft.fromFundId IN (:...fundIds) OR ft.toFundId IN (:...fundIds))",
        {
          fundIds,
        },
      );
    }

    const [incomeExpenses, adjustments, transfers] = await Promise.all([
      ieQB.getMany(),
      adjustmentQb.getMany(),
      ftQb.getMany(),
    ]);

    const replayItems: ReplayItem[] = [
      ...incomeExpenses.map((item) => ({
        type: "INCOME_EXPENSE" as const,
        occurredAt: item.occurredAt,
        data: item,
      })),
      ...adjustments.map((item) => ({
        type: "ADJUSTMENT" as const,
        occurredAt: item.occurredAt,
        data: item,
      })),
      ...transfers.map((item) => ({
        type: "TRANSFER" as const,
        occurredAt: item.occurredAt,
        data: item,
      })),
    ];
    replayItems.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    for (const item of replayItems) {
      switch (item.type) {
        case "INCOME_EXPENSE":
          await this.replayIncomeExpenseTransaction(
            item.data as IncomeExpense,
            mainManager,
          );
          break;
        case "ADJUSTMENT":
          await this.replayFundAdjustment(
            item.data as FundAdjustment,
            mainManager,
          );
          break;
        case "TRANSFER":
          await this.replayFundTransfer(item.data as FundTransfer, mainManager);
          break;
        default:
          break;
      }
    }

    const now = new Date();
    const snapshotDates: Date[] = [];

    const startDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    for (
      let dt = startDate;
      dt <= endDate;
      dt = new Date(dt.getFullYear(), dt.getMonth() + 1, 1)
    ) {
      snapshotDates.push(new Date(dt));
    }

    for (const occurredAt of snapshotDates) {
      await this.createMonthlySnapshot(occurredAt, mainManager, fundIds);
    }
  }

  async replayIncomeExpenseTransaction(
    data: IncomeExpense,
    manager: EntityManager,
  ) {
    const dataTransaction = this.getTransactionDataByIncomeExpense(data);
    await manager.save(FundTransaction, dataTransaction);
  }

  async replayFundAdjustment(data: FundAdjustment, manager: EntityManager) {
    const countedAmount = await this.getBalanceAtDate(
      data.fundId,
      data.occurredAt,
      manager,
    );
    const deltaAmount = Math.abs(data.expectedAmount - countedAmount);
    const direction =
      data.expectedAmount >= countedAmount
        ? FundTransactionType.INCREASE
        : FundTransactionType.DECREASE;

    const newAdjustment = {
      ...data,
      countedAmount,
      deltaAmount,
      direction,
    } as FundAdjustment;
    await manager.save(FundAdjustment, newAdjustment);

    if (deltaAmount === 0) return;

    await manager.save(
      FundTransaction,
      this.getTransactionDataByAdjustment(newAdjustment),
    );
  }

  async replayFundTransfer(data: FundTransfer, manager: EntityManager) {
    const dataTransaction = this.getTransactionDataByFundTransfer(data);
    await manager.save(FundTransaction, dataTransaction);
  }

  async createMonthlySnapshot(
    snapshotDate: Date,
    manager: EntityManager,
    fundIds?: string[],
  ) {
    const deleteQb = manager
      .getRepository(FundSnapshot)
      .createQueryBuilder()
      .delete()
      .where("snapshotAt = :snapshotDate", { snapshotDate });

    if (fundIds && fundIds.length > 0) {
      deleteQb.andWhere("fundId IN (:...fundIds)", { fundIds });
    }

    await deleteQb.execute();

    const transQb = manager
      .createQueryBuilder(FundTransaction, "t")
      .where("t.occurredAt < :snapshotDate", { snapshotDate });

    // Chỉ snapshot các quỹ trong danh sách fundIds nếu có
    if (fundIds && fundIds.length > 0) {
      transQb.andWhere("t.fundId IN (:...fundIds)", { fundIds });
    }

    const transactions = await transQb.getMany();

    const fundBalances: Record<string, number> = {};
    for (const trans of transactions) {
      const sign = trans.type === FundTransactionType.INCREASE ? 1 : -1;
      if (!fundBalances[trans.fundId]) {
        fundBalances[trans.fundId] = 0;
      }
      fundBalances[trans.fundId] += sign * trans.amount;
    }
    const snapshotEntities: FundSnapshot[] = [];
    for (const fundId of Object.keys(fundBalances)) {
      const snapshot = new FundSnapshot();
      snapshot.fundId = fundId;
      snapshot.snapshotAt = snapshotDate;
      snapshot.amount = fundBalances[fundId];
      snapshotEntities.push(snapshot);
    }

    await manager.save(FundSnapshot, snapshotEntities);
  }

  async getBalanceAtDate(
    fundId: string,
    date: Date,
    manager: EntityManager,
  ): Promise<number> {
    // Lấy snapshot gần nhất trước date
    const snapshot = await manager
      .getRepository(FundSnapshot)
      .createQueryBuilder("fs")
      .where("fs.fundId = :fundId", { fundId })
      .andWhere("fs.snapshotAt <= :date", { date })
      .orderBy("fs.snapshotAt", "DESC")
      .getOne();

    let balance = snapshot ? snapshot.amount : 0;

    // Cộng các giao dịch sau snapshot đến date
    const transQb = manager
      .getRepository(FundTransaction)
      .createQueryBuilder("ft")
      .where("ft.fundId = :fundId", { fundId })
      .andWhere("ft.occurredAt > :snapshotDate", {
        snapshotDate: snapshot ? snapshot.snapshotAt : new Date(0),
      })
      .andWhere("ft.occurredAt <= :date", { date });
    const transactions = await transQb.getMany();
    for (const trans of transactions) {
      const sign = trans.type === FundTransactionType.INCREASE ? 1 : -1;
      balance += sign * trans.amount;
    }

    return balance;
  }
}
