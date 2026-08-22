import { injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { VatDebtTransaction } from "@/database/models/store/VatDebtTransaction";
import { Order } from "@/database/models/store/Order";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { VatDebtAdjustment } from "@/database/models/store/VatDebtAdjustment";
import logger from "@/shared/utils/logger";
import { VatDebtSnapshot } from "@/database/models/store/VatDebtSnapshot";
import {
  DebtDirectionEnum,
  DebtRefTypeEnum,
  IncomeExpenseTypeEnum,
  OrderStatusEnum,
  OrderTypeEnum,
  VAT_CATEGORY_NAME,
} from "@/shared/constants/enum";
import { TransactionService } from "@/shared/base/TransactionService";

/**
 * Interface cho các phiếu cần replay
 */
interface ReplayItem {
  type: "ORDER" | "INCOME_EXPENSE" | "ADJUSTMENT";
  occurredAt: Date;
  data: Order | IncomeExpense | VatDebtAdjustment;
}

/**
 * VatDebt Recalculate Service
 * Ghi lại toàn bộ transaction từ một thời điểm khi cần sửa phiếu cũ
 */
@injectable()
export class VatDebtRecalculateService extends TransactionService {
  constructor() {
    super();
  }

  // TODO: Tạo transaction data từ các phiếu: đơn hàng, hợp đồng, điều chỉnh công nợ thuế
  private getTransactionDataByOrder(
    order: Order,
  ): DeepPartial<VatDebtTransaction> {
    const isPurchase = order.type === OrderTypeEnum.PURCHASE;
    const isSale = order.type === OrderTypeEnum.SALE;
    const isPurchaseReturn = order.type === OrderTypeEnum.PURCHASE_RETURN;
    const isSaleReturn = order.type === OrderTypeEnum.SALE_RETURN;

    if (isPurchase) {
      // Mua hàng: Giảm thuế VAT phải nộp (thuế đầu vào)
      return {
        amount: order.taxAmount,
        occurredAt: order.orderAt,
        storeId: order.storeId,
        direction: DebtDirectionEnum.DECREASE,
        refType: DebtRefTypeEnum.PURCHASE,
        refId: order.id,
        refCode: order.code,
      };
    } else if (isSale) {
      // Bán hàng: Tăng thuế VAT phải nộp (thuế đầu ra)
      return {
        amount: order.taxAmount,
        occurredAt: order.orderAt,
        storeId: order.storeId,
        direction: DebtDirectionEnum.INCREASE,
        refType: DebtRefTypeEnum.SALE,
        refId: order.id,
        refCode: order.code,
      };
    } else if (isPurchaseReturn) {
      // Trả hàng nhà cung cấp: Tăng thuế VAT phải nộp (đảo ngược mua hàng)
      return {
        amount: order.taxAmount,
        occurredAt: order.orderAt,
        storeId: order.storeId,
        direction: DebtDirectionEnum.INCREASE,
        refType: DebtRefTypeEnum.PURCHASE_RETURN,
        refId: order.id,
        refCode: order.code,
      };
    } else if (isSaleReturn) {
      // Khách hàng trả hàng: Giảm thuế VAT phải nộp (đảo ngược bán hàng)
      return {
        amount: order.taxAmount,
        occurredAt: order.orderAt,
        storeId: order.storeId,
        direction: DebtDirectionEnum.DECREASE,
        refType: DebtRefTypeEnum.SALE_RETURN,
        refId: order.id,
        refCode: order.code,
      };
    }

    throw new Error(`Loại đơn hàng không hợp lệ: ${order.type}`);
  }
  private getTransactionDataByIncomeExpense(
    incomeExpense: IncomeExpense,
  ): DeepPartial<VatDebtTransaction> {
    return {
      amount: incomeExpense.amount,
      occurredAt: incomeExpense.occurredAt,
      storeId: incomeExpense.storeId,
      direction: DebtDirectionEnum.DECREASE,
      refType: DebtRefTypeEnum.EXPENSE,
      refId: incomeExpense.id,
      refCode: incomeExpense.code,
    };
  }
  private getTransactionDataByAdjustment(
    adjustment: VatDebtAdjustment,
  ): DeepPartial<VatDebtTransaction> {
    return {
      amount: adjustment.deltaAmount,
      occurredAt: adjustment.occurredAt,
      storeId: adjustment.storeId,
      direction: adjustment.direction,
      refType: DebtRefTypeEnum.ADJUSTMENT,
      refId: adjustment.id,
      refCode: adjustment.code,
    };
  }

  /**
   * Tính lại công nợ từ một thời điểm, có thể cho một partner cụ thể
   * @param storeId
   * @param fromDate
   * @param manager
   * @returns
   */
  async recalculateFromDate(
    storeId: string,
    fromDate: Date,
    manager?: EntityManager,
  ): Promise<{
    deletedTransactions: number;
    replayedOrders: number;
    replayedIncomeExpenses: number;
    replayedAdjustments: number;
    totalReplayed: number;
  }> {
    const mainManager = manager || (await this.getManager());

    logger.info(
      `[VatDebtRecalculateService] Bắt đầu ghi lại từ ${fromDate.toISOString()} trong store ${storeId}`,
    );

    // // * Cho phép công nợ âm khi tính lại

    // // ===== BƯỚC 1: XÓA DỮ LIỆU CŨ =====
    // logger.info(
    //   `[VatDebtRecalculateService] Bước 1: Xóa transaction, snapshot >= fromDate`,
    // );
    const txQb = mainManager
      .getRepository(VatDebtTransaction)
      .createQueryBuilder()
      .delete()
      .where("storeId = :storeId", { storeId })
      .andWhere("occurredAt >= :fromDate", { fromDate });

    const deletedTxResult = await txQb.execute();
    const deletedTransactions = deletedTxResult.affected || 0;

    const snapshotQb = mainManager
      .getRepository(VatDebtSnapshot)
      .createQueryBuilder()
      .delete()
      .where("storeId = :storeId", { storeId })
      .andWhere("snapshotAt >= :fromDate", { fromDate });
    await snapshotQb.execute();

    // logger.warn(`[VatDebtRecalculateService] Đã xóa:
    //   ${deletedTransactions} transaction,
    //   ${deletedSnapshots} snapshots`);

    // // ===== BƯỚC 2: LẤY TẤT CẢ PHIẾU CẦN REPLAY =====
    // logger.info(
    //   `[VatDebtRecalculateService] Bước 2: Lấy tất cả phiếu cần replay`,
    // );

    // TODO: Tạo query
    const orderQb = mainManager
      .getRepository(Order)
      .createQueryBuilder("order")
      .where("order.storeId = :storeId", { storeId })
      .andWhere("order.orderAt >= :fromDate", { fromDate })
      .andWhere("order.status = :status", { status: OrderStatusEnum.POSTED });
    const ieQb = mainManager
      .getRepository(IncomeExpense)
      .createQueryBuilder("ie")
      .leftJoinAndSelect("ie.category", "category")
      .where("ie.storeId = :storeId", { storeId })
      .andWhere("ie.occurredAt >= :fromDate", { fromDate })
      // Chỉ lấy các phiếu chi (theo category nộp thuế VAT)
      .andWhere("ie.type = :type", { type: IncomeExpenseTypeEnum.EXPENSE })
      .andWhere("category.name = :categoryName", {
        categoryName: VAT_CATEGORY_NAME,
      });

    const adjustmentQb = mainManager
      .getRepository(VatDebtAdjustment)
      .createQueryBuilder("adjustment")
      .where("adjustment.storeId = :storeId", { storeId })
      .andWhere("adjustment.occurredAt >= :fromDate", { fromDate });

    const [orders, incomeExpenses, adjustments] = await Promise.all([
      orderQb.getMany(),
      ieQb.getMany(),
      adjustmentQb.getMany(),
    ]);

    // ===== BƯỚC 3: MERGE VÀ SORT THEO THỜI GIAN =====
    // logger.info(
    //   `[VatDebtRecalculateService] Bước 3: Merge và sắp xếp các phiếu theo thời gian`,
    // );

    const replayItems: ReplayItem[] = [
      ...orders.map((o) => ({
        type: "ORDER" as const,
        occurredAt: o.orderAt,
        data: o,
      })),
      ...incomeExpenses.map((ie) => ({
        type: "INCOME_EXPENSE" as const,
        occurredAt: ie.occurredAt,
        data: ie,
      })),
      ...adjustments.map((adj) => ({
        type: "ADJUSTMENT" as const,
        occurredAt: adj.occurredAt,
        data: adj,
      })),
    ];
    // Sắp xếp theo occurredAt
    replayItems.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    // logger.info(
    //   `[VatDebtRecalculateService] Tổng cộng có ${replayItems.length} phiếu cần replay`,
    // );

    // // ===== BƯỚC 4: REPLAY TỪNG PHIẾU THEO THỨ TỰ THỜI GIAN =====
    // logger.info(
    //   `[VatDebtRecalculateService] Bước 4: Bắt đầu thu thập dữ liệu transaction từ các phiếu`,
    // );

    let replayedOrders = 0;
    let replayedIncomeExpenses = 0;
    let replayedAdjustments = 0;

    for (const item of replayItems) {
      try {
        switch (item.type) {
          case "ORDER":
            await this.replayOrder(item.data as Order, mainManager);
            replayedOrders++;
            break;
          case "INCOME_EXPENSE":
            await this.replayIncomeExpense(
              item.data as IncomeExpense,
              mainManager,
            );
            replayedIncomeExpenses++;
            break;
          case "ADJUSTMENT":
            await this.replayAdjustment(
              item.data as VatDebtAdjustment,
              mainManager,
            );
            replayedAdjustments++;
            break;
          default:
            // logger.error(
            //   `[VatDebtRecalculateService] Loại phiếu không xác định: ${item.type}`,
            // );
            break;
        }
      } catch (error) {
        logger.error(
          `[VatDebtRecalculateService] Lỗi khi thu thập dữ liệu từ phiếu ${item.type} vào ${item.occurredAt.toISOString()}: ${error}`,
        );
        throw error;
      }
    }

    // ===== BƯỚC 5: GHI LẠI SNAPSHOT =====
    // logger.info(
    //   `[VatDebtRecalculateService] Bước 5: Ghi lại các snapshot hiện tại`,
    // );
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

    for (const snapshotAt of snapshotDates) {
      await this.createMonthlySnapshot(storeId, snapshotAt, mainManager);
    }
    // logger.info(
    //   `[VatDebtRecalculateService] Đã ghi lại ${snapshotDates.length} snapshot`,
    // );

    logger.info(`[VatDebtRecalculateService] Hoàn thành!`);

    return {
      deletedTransactions,
      replayedOrders,
      replayedIncomeExpenses,
      replayedAdjustments,
      totalReplayed:
        replayedOrders + replayedIncomeExpenses + replayedAdjustments,
    };
  }

  /**
   * Replay Order
   * @param data Order
   * @param manager EntityManager
   */
  private async replayOrder(
    data: Order,
    manager: EntityManager,
  ): Promise<void> {
    if (data.taxAmount === 0) return;
    await manager.save(
      VatDebtTransaction,
      this.getTransactionDataByOrder(data),
    );
  }

  /**
   * Replay IncomeExpense
   * @param data IncomeExpense
   * @param manager EntityManager
   */
  private async replayIncomeExpense(
    data: IncomeExpense,
    manager: EntityManager,
  ): Promise<void> {
    // Chỉ tính các phiếu chi thuộc category nộp thuế VAT
    if (
      data.type !== IncomeExpenseTypeEnum.EXPENSE ||
      data.category?.name !== VAT_CATEGORY_NAME
    )
      return;

    await manager.save(
      VatDebtTransaction,
      this.getTransactionDataByIncomeExpense(data),
    );
  }

  /**
   * Replay VatDebtAdjustment
   * @param data VatDebtAdjustment
   * @param manager EntityManager
   */
  private async replayAdjustment(
    data: VatDebtAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    // Phải tính lại bản ghi
    const countedAmount = await this.getDebtAtDate(
      data.storeId,
      data.occurredAt,
      manager,
    );
    const deltaAmount = Math.abs(data.expectedAmount - countedAmount);
    const direction =
      data.expectedAmount >= countedAmount
        ? DebtDirectionEnum.INCREASE
        : DebtDirectionEnum.DECREASE;

    const newAdjustment = {
      ...data,
      countedAmount,
      deltaAmount,
      direction,
    } as VatDebtAdjustment;

    await manager.save(VatDebtAdjustment, newAdjustment);

    if (deltaAmount === 0) return;

    await manager.save(
      VatDebtTransaction,
      this.getTransactionDataByAdjustment(newAdjustment),
    );
  }

  /**
   * Tính snapshot công nợ hàng tháng
   * @param snapshotDate
   * @param manager
   * @param partnerId
   */
  async createMonthlySnapshot(
    storeId: string,
    snapshotDate: Date,
    manager: EntityManager,
  ): Promise<void> {
    const txQb = manager
      .createQueryBuilder(VatDebtTransaction, "t")
      .where("t.occurredAt <= :snapshotDate", { snapshotDate });

    if (storeId) {
      txQb.andWhere("t.storeId = :storeId", { storeId });
    }

    const transactions = await txQb.getMany();

    let amount = 0;

    for (const tx of transactions) {
      const sign = tx.direction === DebtDirectionEnum.INCREASE ? 1 : -1;
      amount += sign * tx.amount;
    }

    const replaySnapshots: DeepPartial<VatDebtSnapshot> = {
      storeId,
      snapshotAt: snapshotDate,
      amount,
    };

    await manager.save(VatDebtSnapshot, replaySnapshots);
  }

  /**
   * Lấy công nợ của store tại một thời điểm theo bên
   * @param storeId
   * @param atDate
   * @param manager
   * @returns
   */
  async getDebtAtDate(
    storeId: string,
    atDate: Date,
    manager: EntityManager,
  ): Promise<number> {
    // Lấy snapshot gần nhất trước atDate
    const snapshot = await manager
      .getRepository(VatDebtSnapshot)
      .createQueryBuilder("snapshot")
      .where("snapshot.storeId = :storeId", { storeId })
      .andWhere("snapshot.snapshotAt <= :atDate", { atDate })
      .orderBy("snapshot.snapshotAt", "DESC")
      .getOne();

    let debtAmount = snapshot ? snapshot.amount : 0;

    // Cộng dồn các transaction từ snapshot đến atDate
    const txs = await manager
      .getRepository(VatDebtTransaction)
      .createQueryBuilder("tx")
      .where("tx.storeId = :storeId", { storeId })
      .andWhere("tx.occurredAt > :snapshotAt", {
        snapshotAt: snapshot ? snapshot.snapshotAt : new Date(0),
      })
      .andWhere("tx.occurredAt <= :atDate", { atDate })
      .getMany();

    for (const tx of txs) {
      const sign = tx.direction === DebtDirectionEnum.INCREASE ? 1 : -1;
      debtAmount += sign * tx.amount;
    }

    return debtAmount;
  }
}
