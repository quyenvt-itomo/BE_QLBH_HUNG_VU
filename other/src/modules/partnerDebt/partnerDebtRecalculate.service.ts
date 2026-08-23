import { injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { PartnerDebtTransaction } from "@/database/models/store/PartnerDebtTransaction";
import { Order } from "@/database/models/store/Order";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { PartnerDebtAdjustment } from "@/database/models/store/PartnerDebtAdjustment";
import { PartnerDebtOffset } from "@/database/models/store/PartnerDebtOffset";
import logger from "@/shared/utils/logger";
import { PartnerDebtSnapshot } from "@/database/models/store/PartnerDebtSnapshot";
import {
  DebtDirectionEnum,
  DebtRefTypeEnum,
  IncomeExpenseTypeEnum,
  OrderStatusEnum,
  OrderTypeEnum,
  PartnerDebtSideEnum,
} from "@/shared/constants/enum";
import { TransactionService } from "@/shared/base/TransactionService";
import { Store } from "@/database/models/Store";

/**
 * Interface cho các phiếu cần replay
 */
interface ReplayItem {
  type: "ORDER" | "INCOME_EXPENSE" | "ADJUSTMENT" | "OFFSET";
  occurredAt: Date;
  data: Order | IncomeExpense | PartnerDebtAdjustment | PartnerDebtOffset;
}

/**
 * PartnerDebt Recalculate Service
 * Ghi lại toàn bộ transaction từ một thời điểm khi cần sửa phiếu cũ
 */
@injectable()
export class PartnerDebtRecalculateService extends TransactionService {
  constructor() {
    super();
  }

  // TODO: Tạo transaction data từ các phiếu: đơn hàng, hợp đồng, điều chỉnh công nợ, đối soát công nợ
  private async getTransactionDataByOrder(
    order: Order,
    manager: EntityManager,
  ): Promise<DeepPartial<PartnerDebtTransaction>[]> {
    const {
      type,
      totalAmount,
      loyaltyPointsDiscountAmount,
      orderAt,
      partnerId,
      storeId,
      id,
      code,
    } = order;

    // Công nợ phải tính trừ đi cả điểm, và phải trừ đi phần khách đã thanh toán nếu có (tức là chỉ tính phần còn lại chưa thanh toán)
    const payment = order.incomeExpenses?.reduce(
      (sum, ie) => sum + ie.amount,
      0,
    );

    const debtAmount =
      totalAmount - (loyaltyPointsDiscountAmount || 0) - (payment || 0);

    const transactions: DeepPartial<PartnerDebtTransaction>[] = [];

    // Nếu debtAmount <= 0 tức là không phát sinh công nợ mới, có thể do khách đã thanh toán trước hoặc đơn hàng chỉ có điểm mà không có tiền, thì sẽ không cần ghi transaction công nợ nữa
    if (debtAmount > 0) {
      switch (type) {
        // ========== PURCHASE: Tăng phải trả ==========
        case OrderTypeEnum.PURCHASE:
          transactions.push({
            amount: debtAmount,
            occurredAt: orderAt,
            partnerId: partnerId!,
            storeId,
            direction: DebtDirectionEnum.INCREASE,
            side: PartnerDebtSideEnum.PAYABLE,
            refType: DebtRefTypeEnum.PURCHASE,
            refId: id,
            refCode: code,
          });
          break;

        // ========== SALE: Tăng phải thu ==========
        case OrderTypeEnum.SALE:
          transactions.push({
            amount: debtAmount,
            occurredAt: orderAt,
            partnerId: partnerId!,
            storeId,
            direction: DebtDirectionEnum.INCREASE,
            side: PartnerDebtSideEnum.RECEIVABLE,
            refType: DebtRefTypeEnum.SALE,
            refId: id,
            refCode: code,
          });
          if (order.shipperId && order.shippingFee && order.shippingFee > 0) {
            transactions.push({
              amount: order.shippingFee,
              occurredAt: orderAt,
              partnerId: order.shipperId,
              storeId,
              direction: DebtDirectionEnum.INCREASE,
              side: PartnerDebtSideEnum.PAYABLE,
              refType: DebtRefTypeEnum.SHIPPING_FEE,
              refId: id,
              refCode: code,
            });
          }
          break;

        // ========== PURCHASE_RETURN: (trả hàng NCC) ==========
        case OrderTypeEnum.PURCHASE_RETURN:
          // Giảm phải trả nhưng nếu phải trả nhỏ hơn thì thành tăng phải thu
          const payableDebtAmount = await this.getDebtAtDateBySide(
            PartnerDebtSideEnum.PAYABLE,
            partnerId!,
            orderAt,
            manager,
            storeId,
          );
          const isLessThanPayableDebt = debtAmount > payableDebtAmount;
          transactions.push({
            amount: debtAmount,
            occurredAt: orderAt,
            partnerId: partnerId!,
            storeId,
            // direction: DebtDirectionEnum.DECREASE,
            direction: isLessThanPayableDebt
              ? DebtDirectionEnum.INCREASE
              : DebtDirectionEnum.DECREASE,
            // side: PartnerDebtSideEnum.PAYABLE,
            side: isLessThanPayableDebt
              ? PartnerDebtSideEnum.RECEIVABLE
              : PartnerDebtSideEnum.PAYABLE,
            refType: DebtRefTypeEnum.PURCHASE_RETURN,
            refId: id,
            refCode: code,
          });
          break;

        // ========== SALE_RETURN: (khách trả hàng) ==========
        case OrderTypeEnum.SALE_RETURN:
          transactions.push({
            amount: debtAmount,
            occurredAt: orderAt,
            partnerId: partnerId!,
            storeId,
            direction: DebtDirectionEnum.INCREASE,
            side: PartnerDebtSideEnum.RECEIVABLE,
            refType: DebtRefTypeEnum.SALE_RETURN,
            refId: id,
            refCode: code,
          });

        default:
          break;
      }
    }

    if (
      (type === OrderTypeEnum.SALE || type === OrderTypeEnum.SALE_RETURN) &&
      order.shipperId &&
      order.shippingFee &&
      order.shippingFee > 0
    ) {
      transactions.push({
        amount: order.shippingFee,
        occurredAt: orderAt,
        partnerId: order.shipperId,
        storeId,
        direction: DebtDirectionEnum.INCREASE,
        side: PartnerDebtSideEnum.PAYABLE,
        refType: DebtRefTypeEnum.SHIPPING_FEE,
        refId: id,
        refCode: code,
      });
    }

    return transactions;
  }
  private getTransactionDataByIncomeExpense(
    incomeExpense: IncomeExpense,
  ): DeepPartial<PartnerDebtTransaction> {
    const isExpense = incomeExpense.type === IncomeExpenseTypeEnum.EXPENSE;
    return {
      amount: incomeExpense.amount,
      occurredAt: incomeExpense.occurredAt,
      partnerId: incomeExpense.partnerId!,
      storeId: incomeExpense.storeId,
      direction: DebtDirectionEnum.DECREASE,
      side: isExpense
        ? PartnerDebtSideEnum.PAYABLE
        : PartnerDebtSideEnum.RECEIVABLE,
      refType: isExpense ? DebtRefTypeEnum.EXPENSE : DebtRefTypeEnum.INCOME,
      refId: incomeExpense.id,
      refCode: incomeExpense.code,
    };
  }
  private getTransactionDataByAdjustment(
    adjustment: PartnerDebtAdjustment,
  ): DeepPartial<PartnerDebtTransaction> {
    return {
      amount: adjustment.deltaAmount,
      occurredAt: adjustment.occurredAt,
      partnerId: adjustment.partnerId,
      storeId: adjustment.storeId,
      direction: adjustment.direction,
      side: adjustment.side,
      refType: DebtRefTypeEnum.ADJUSTMENT,
      refId: adjustment.id,
      refCode: adjustment.code,
    };
  }
  private getTransactionDataByOffset(
    offset: PartnerDebtOffset,
  ): DeepPartial<PartnerDebtTransaction> {
    return {
      amount: offset.offsetAmount,
      occurredAt: offset.occurredAt,
      partnerId: offset.partnerId,
      storeId: offset.storeId,
      direction: DebtDirectionEnum.DECREASE,
      refType: DebtRefTypeEnum.DEBT_OFFSET,
      refId: offset.id,
      refCode: offset.code,
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
    partnerIds?: string[],
  ): Promise<{
    deletedTransactions: number;
    replayedOrders: number;
    replayedIncomeExpenses: number;
    replayedAdjustments: number;
    replayedOffsets: number;
    totalReplayed: number;
  }> {
    const mainManager = manager || (await this.getManager());

    logger.info(
      `[PartnerDebtRecalculateService] Bắt đầu ghi lại từ ${fromDate.toISOString()} trong store ${storeId}`,
    );

    // // ===== BƯỚC 1: XÓA TRANSACTION + SNAPSHOT =====
    // logger.info(
    //   `[PartnerDebtRecalculateService] Bước 1: Xóa transaction, snapshot >= fromDate`,
    // );

    const txDeleteQb = mainManager
      .getRepository(PartnerDebtTransaction)
      .createQueryBuilder()
      .delete()
      .where("storeId = :storeId", { storeId })
      .andWhere("occurredAt >= :fromDate", { fromDate });

    if (partnerIds?.length) {
      txDeleteQb.andWhere("partnerId IN (:...partnerIds)", { partnerIds });
    }

    const deletedTransactions = (await txDeleteQb.execute()).affected || 0;

    const snapshotDeleteQb = mainManager
      .getRepository(PartnerDebtSnapshot)
      .createQueryBuilder()
      .delete()
      .where("storeId = :storeId", { storeId })
      .andWhere("snapshotAt >= :fromDate", { fromDate });

    if (partnerIds?.length) {
      snapshotDeleteQb.andWhere("partnerId IN (:...partnerIds)", {
        partnerIds,
      });
    }

    await snapshotDeleteQb.execute();

    // logger.warn(
    //   `[PartnerDebtRecalculateService] Đã xóa ${deletedTransactions} transaction`,
    // );

    // // ===== BƯỚC 2: LẤY DỮ LIỆU CẦN REPLAY =====
    // logger.info(
    //   `[PartnerDebtRecalculateService] Bước 2: Lấy dữ liệu cần replay`,
    // );

    const orderQb = mainManager
      .getRepository(Order)
      .createQueryBuilder("o")
      .where("o.storeId = :storeId", { storeId })
      .andWhere("o.orderAt >= :fromDate", { fromDate })
      .andWhere("o.status = :status", { status: OrderStatusEnum.POSTED })
      .andWhere("o.partnerId IS NOT NULL")
      // Lấy thêm incomeExpense liên quan để tính phần đã thanh toán, từ đó tính ra phần công nợ phát sinh mới chính xác
      .leftJoinAndSelect("o.incomeExpenses", "ie");

    if (partnerIds?.length) {
      orderQb.andWhere("o.partnerId IN (:...partnerIds)", { partnerIds });
    }

    const ieQb = mainManager
      .getRepository(IncomeExpense)
      .createQueryBuilder("ie")
      .where("ie.storeId = :storeId", { storeId })
      .andWhere("ie.occurredAt >= :fromDate", { fromDate })
      .andWhere("ie.partnerId IS NOT NULL")
      // Không lấy những phiếu đã liên kết với đơn hàng (orderId is null) ở trên vì đã được tính trong phần transaction của đơn hàng rồi, nếu lấy sẽ bị trùng transaction
      .andWhere("ie.orderId IS NULL");

    if (partnerIds?.length) {
      ieQb.andWhere("ie.partnerId IN (:...partnerIds)", { partnerIds });
    }

    const adjustmentQb = mainManager
      .getRepository(PartnerDebtAdjustment)
      .createQueryBuilder("a")
      .where("a.storeId = :storeId", { storeId })
      .andWhere("a.occurredAt >= :fromDate", { fromDate });

    if (partnerIds?.length) {
      adjustmentQb.andWhere("a.partnerId IN (:...partnerIds)", {
        partnerIds,
      });
    }

    const offsetQb = mainManager
      .getRepository(PartnerDebtOffset)
      .createQueryBuilder("o")
      .where("o.storeId = :storeId", { storeId })
      .andWhere("o.occurredAt >= :fromDate", { fromDate });

    if (partnerIds?.length) {
      offsetQb.andWhere("o.partnerId IN (:...partnerIds)", {
        partnerIds,
      });
    }

    const [orders, incomeExpenses, adjustments, offsets] = await Promise.all([
      orderQb.getMany(),
      ieQb.getMany(),
      adjustmentQb.getMany(),
      offsetQb.getMany(),
    ]);

    // ===== BƯỚC 3: MERGE + SORT =====
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
      ...adjustments.map((a) => ({
        type: "ADJUSTMENT" as const,
        occurredAt: a.occurredAt,
        data: a,
      })),
      ...offsets.map((o) => ({
        type: "OFFSET" as const,
        occurredAt: o.occurredAt,
        data: o,
      })),
    ];

    replayItems.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    // ===== BƯỚC 4: REPLAY =====
    let replayedOrders = 0;
    let replayedIncomeExpenses = 0;
    let replayedAdjustments = 0;
    let replayedOffsets = 0;

    for (const item of replayItems) {
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
            item.data as PartnerDebtAdjustment,
            mainManager,
          );
          replayedAdjustments++;
          break;
        case "OFFSET":
          await this.replayOffset(item.data as PartnerDebtOffset, mainManager);
          replayedOffsets++;
          break;
      }
    }

    // ===== BƯỚC 5: SNAPSHOT =====
    const snapshotDates: Date[] = [];
    const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const end = new Date();

    for (
      let d = start;
      d <= end;
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    ) {
      snapshotDates.push(new Date(d));
    }

    for (const snapshotAt of snapshotDates) {
      await this.createMonthlySnapshot(
        storeId,
        snapshotAt,
        mainManager,
        partnerIds,
      );
    }

    logger.info(
      `[PartnerDebtRecalculateService] Hoàn thành ghi lại từ ${fromDate.toISOString()} trong store ${storeId}`,
    );

    return {
      deletedTransactions,
      replayedOrders,
      replayedIncomeExpenses,
      replayedAdjustments,
      replayedOffsets,
      totalReplayed:
        replayedOrders +
        replayedIncomeExpenses +
        replayedAdjustments +
        replayedOffsets,
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
    await manager.save(
      PartnerDebtTransaction,
      await this.getTransactionDataByOrder(data, manager),
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
    await manager.save(
      PartnerDebtTransaction,
      this.getTransactionDataByIncomeExpense(data),
    );
  }

  /**
   * Replay PartnerDebtAdjustment
   * @param data PartnerDebtAdjustment
   * @param manager EntityManager
   */
  private async replayAdjustment(
    data: PartnerDebtAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    // Phải tính lại bản ghi
    const countedAmount = await this.getDebtAtDateBySide(
      data.side,
      data.partnerId,
      data.occurredAt,
      manager,
      data.storeId,
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
    } as PartnerDebtAdjustment;

    await manager.save(PartnerDebtAdjustment, newAdjustment);

    if (deltaAmount === 0) return;

    await manager.save(
      PartnerDebtTransaction,
      this.getTransactionDataByAdjustment(newAdjustment),
    );
  }

  /**
   * Replay PartnerDebtOffset
   * @param data PartnerDebtOffset
   * @param manager EntityManager
   */
  private async replayOffset(
    data: PartnerDebtOffset,
    manager: EntityManager,
  ): Promise<void> {
    // Phải tính lại bản ghi
    const payableDebtAtDate = await this.getDebtAtDateBySide(
      PartnerDebtSideEnum.PAYABLE,
      data.partnerId,
      data.occurredAt,
      manager,
    );
    const receivableDebtAtDate = await this.getDebtAtDateBySide(
      PartnerDebtSideEnum.RECEIVABLE,
      data.partnerId,
      data.occurredAt,
      manager,
    );
    const newOffset = {
      ...data,
      payableDebtAmount: payableDebtAtDate,
      receivableDebtAmount: receivableDebtAtDate,
    } as PartnerDebtOffset;
    await manager.save(PartnerDebtOffset, newOffset);

    // Tính toán số tiền đối trừ
    const partialTransaction = this.getTransactionDataByOffset(newOffset);

    // Đối trừ công nợ cả hai bên (Một phiếu tạo hai transaction)
    await manager.save(PartnerDebtTransaction, [
      {
        ...partialTransaction,
        side: PartnerDebtSideEnum.PAYABLE,
      },
      {
        ...partialTransaction,
        side: PartnerDebtSideEnum.RECEIVABLE,
      },
    ]);
  }

  /**
   * Tính snapshot công nợ hàng tháng
   * @param storeId
   * @param snapshotDate
   * @param manager
   * @param partnerIds
   */
  async createMonthlySnapshot(
    storeId: string,
    snapshotDate: Date,
    manager: EntityManager,
    partnerIds?: string[],
  ): Promise<void> {
    const deleteQb = manager
      .getRepository(PartnerDebtSnapshot)
      .createQueryBuilder()
      .delete()
      .where("snapshotAt = :snapshotDate", { snapshotDate })
      .andWhere("storeId = :storeId", { storeId });

    if (partnerIds && partnerIds.length > 0) {
      deleteQb.andWhere("partnerId IN (:...partnerIds)", { partnerIds });
    }

    await deleteQb.execute();

    const txQb = manager
      .createQueryBuilder(PartnerDebtTransaction, "t")
      .where("t.occurredAt <= :snapshotDate", { snapshotDate })
      .andWhere("t.storeId = :storeId", { storeId });

    // Chỉ snapshot các partner được chỉ định (nếu có)
    if (partnerIds && partnerIds.length > 0) {
      txQb.andWhere("t.partnerId IN (:...partnerIds)", { partnerIds });
    }

    const transactions = await txQb.getMany();

    /**
     * Key: partnerId_side
     */
    const debtMap = new Map<
      string,
      {
        partnerId: string;
        side: PartnerDebtSideEnum;
        amount: number;
      }
    >();

    for (const tx of transactions) {
      const sign = tx.direction === DebtDirectionEnum.INCREASE ? 1 : -1;
      const key = `${tx.partnerId}_${tx.side}`;

      if (!debtMap.has(key)) {
        debtMap.set(key, {
          partnerId: tx.partnerId,
          side: tx.side,
          amount: 0,
        });
      }

      debtMap.get(key)!.amount += sign * tx.amount;
    }

    const snapshots: DeepPartial<PartnerDebtSnapshot>[] = [];

    for (const item of debtMap.values()) {
      snapshots.push({
        partnerId: item.partnerId,
        storeId,
        side: item.side,
        amount: item.amount,
        snapshotAt: snapshotDate,
      });
    }

    await manager.save(PartnerDebtSnapshot, snapshots);
  }

  /**
   * Lấy công nợ của partner tại một thời điểm theo bên
   * @param side
   * @param partnerId
   * @param atDate
   * @param manager
   * @param storeId - Nếu có thì chỉ tính cho 1 cửa hàng, không có thì cộng dồn tất cả cửa hàng
   * @returns
   */
  async getDebtAtDateBySide(
    side: PartnerDebtSideEnum,
    partnerId: string,
    atDate: Date,
    manager: EntityManager,
    storeId?: string,
  ): Promise<number> {
    if (storeId) {
      // Tính công nợ cho 1 cửa hàng cụ thể
      return this.calculateDebtForStore(
        side,
        partnerId,
        storeId,
        atDate,
        manager,
      );
    } else {
      const allStoreIds = await manager
        .getRepository(Store)
        .createQueryBuilder("s")
        .select("s.id", "storeId")
        .where("s.deletedAt IS NULL")
        .getRawMany<{ storeId: string }>();

      const storeIdsResult = allStoreIds;

      let totalDebt = 0;
      for (const row of storeIdsResult) {
        const debt = await this.calculateDebtForStore(
          side,
          partnerId,
          row.storeId,
          atDate,
          manager,
        );
        totalDebt += debt;
      }

      return totalDebt;
    }
  }

  /**
   * Tính công nợ cho 1 cửa hàng cụ thể
   * @param side
   * @param partnerId
   * @param storeId
   * @param atDate
   * @param manager
   * @returns
   */
  private async calculateDebtForStore(
    side: PartnerDebtSideEnum,
    partnerId: string,
    storeId: string,
    atDate: Date,
    manager: EntityManager,
  ): Promise<number> {
    // Lấy snapshot gần nhất trước atDate cho cửa hàng này
    const snapshot = await manager
      .getRepository(PartnerDebtSnapshot)
      .createQueryBuilder("snapshot")
      .where("snapshot.partnerId = :partnerId", { partnerId })
      .andWhere("snapshot.storeId = :storeId", { storeId })
      .andWhere("snapshot.side = :side", { side })
      .andWhere("snapshot.snapshotAt <= :atDate", { atDate })
      .orderBy("snapshot.snapshotAt", "DESC")
      .getOne();

    let debtAmount = snapshot ? snapshot.amount : 0;

    // Cộng dồn các transaction từ snapshot đến atDate
    const txs = await manager
      .getRepository(PartnerDebtTransaction)
      .createQueryBuilder("tx")
      .where("tx.partnerId = :partnerId", { partnerId })
      .andWhere("tx.storeId = :storeId", { storeId })
      .andWhere("tx.side = :side", { side })
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
