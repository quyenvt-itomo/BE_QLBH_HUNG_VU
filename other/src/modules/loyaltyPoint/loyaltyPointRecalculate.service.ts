import { injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { LoyaltyPointTransaction } from "@/database/models/LoyaltyPointTransaction";
import { LoyaltyPointSnapshot } from "@/database/models/LoyaltyPointSnapshot";
import { LoyaltyPointAdjustment } from "@/database/models/LoyaltyPointAdjustment";
import { Order } from "@/database/models/store/Order";
import { Partner } from "@/database/models/Partner";
import logger from "@/shared/utils/logger";
import {
  LoyaltyPointTransactionTypeEnum,
  LoyaltyPointRefTypeEnum,
  OrderTypeEnum,
  OrderStatusEnum,
} from "@/shared/constants/enum";
import { TransactionService } from "@/shared/base/TransactionService";

/**
 * Interface cho các phiếu cần replay
 */
interface ReplayItem {
  type: "ORDER" | "ADJUSTMENT";
  occurredAt: Date;
  data: Order | LoyaltyPointAdjustment;
}

/**
 * LoyaltyPoint Recalculate Service
 * Tính lại điểm tích lũy từ một thời điểm
 */
@injectable()
export class LoyaltyPointRecalculateService extends TransactionService {
  constructor() {
    super();
  }

  /**
   * Logic business: Tạo transaction data từ Order
   *
   * Tích điểm dựa trên totalRevenue tích lũy:
   * - SALE: Đơn bán hàng → Tăng doanh thu và điểm
   * - SALE_RETURN: Đơn đổi hàng (thu lại hàng cũ, bán hàng mới) → Vẫn tăng doanh thu và điểm
   *   (vì giá trị đơn không âm, KH vẫn phải trả thêm tiền)
   */
  private async getTransactionDataByOrder(
    order: Order,
    manager: EntityManager,
  ): Promise<DeepPartial<LoyaltyPointTransaction>[]> {
    const { type, partnerId, orderAt, id, code } = order;

    const isSale = type === OrderTypeEnum.SALE;
    const isSaleReturn = type === OrderTypeEnum.SALE_RETURN;

    // Chỉ xử lý đơn bán hàng và đổi hàng
    if (!isSale && !isSaleReturn) {
      return [];
    }

    if (!partnerId) {
      return [];
    }

    const transactions: DeepPartial<LoyaltyPointTransaction>[] = [];

    const { loyaltyPointsUsed = 0, netAmount, pointEarnRate = 100000 } = order;

    // Tính revenue để tích điểm
    // NOTE: KHÔNG trừ loyaltyPointsDiscountAmount vì:
    // - netAmount đã là giá trị SAU line/order discount, TRƯỚC loyalty discount
    // - Loyalty discount chỉ ảnh hưởng số tiền khách trả, không ảnh hưởng doanh thu
    // - Khách vẫn được tích điểm trên toàn bộ giá trị đơn hàng
    const revenueForPoints = netAmount;

    // Lấy revenue từ cache (đã tích lũy trong quá trình replay)
    const totalRevenueBefore = await this.getTotalRevenueAtDate(
      partnerId,
      new Date(orderAt.getTime() - 1),
      manager,
    );

    // 1. Sử dụng điểm thanh toán (cả SALE và SALE_RETURN đều có thể dùng điểm)
    // Transaction này KHÔNG thay đổi revenue
    if (loyaltyPointsUsed > 0) {
      const milestoneBefore =
        Math.floor(totalRevenueBefore / pointEarnRate) * pointEarnRate;

      transactions.push({
        partnerId,
        occurredAt: orderAt,
        type: LoyaltyPointTransactionTypeEnum.DECREASE,
        points: loyaltyPointsUsed,
        refType: LoyaltyPointRefTypeEnum.ORDER,
        refId: id,
        refCode: code,
        // Accumulated state (không thay đổi revenue khi tiêu điểm)
        revenueChange: 0,
        accumulatedRevenue: totalRevenueBefore,
        revenueForPointsMilestone: milestoneBefore,
        pointEarnRate,
      });
    }

    // 2. Tích điểm từ doanh số (cả SALE và SALE_RETURN đều tích điểm nếu revenue > 0)
    // Transaction này TĂNG revenue.
    // Cùng occurredAt với DECREASE — thứ tự được đảm bảo bởi createdAt
    // (DECREASE được push trước → save trước → createdAt nhỏ hơn).
    // Các hàm getTotalRevenueAtDate / getPointsAtDate xử lý đúng khi cùng occurredAt.
    if (revenueForPoints > 0) {
      const totalRevenueAfter = totalRevenueBefore + revenueForPoints;

      // Tính điểm từ tổng revenue
      // ĐÚNG: floor(after) - floor(before), KHÔNG PHẢI floor(after - before)
      const pointsBefore = Math.floor(totalRevenueBefore / pointEarnRate);
      const pointsAfter = Math.floor(totalRevenueAfter / pointEarnRate);
      const pointsDelta = pointsAfter - pointsBefore;

      const milestoneAfter =
        Math.floor(totalRevenueAfter / pointEarnRate) * pointEarnRate;

      // Luôn lưu transaction doanh thu để accumulatedRevenue không bị đứt quãng.
      // Nếu pointsDelta = 0 thì đây là transaction "carry revenue".
      transactions.push({
        partnerId,
        occurredAt: orderAt,
        type: LoyaltyPointTransactionTypeEnum.INCREASE,
        points: pointsDelta,
        refType: LoyaltyPointRefTypeEnum.ORDER,
        refId: id,
        refCode: code,
        // Accumulated state
        revenueChange: revenueForPoints,
        accumulatedRevenue: totalRevenueAfter,
        revenueForPointsMilestone: milestoneAfter,
        pointEarnRate,
      });
    }

    return transactions;
  }

  /**
   * Logic business: Tạo transaction data từ LoyaltyPointAdjustment
   */
  private getTransactionDataByAdjustment(
    adjustment: LoyaltyPointAdjustment,
  ): DeepPartial<LoyaltyPointTransaction> {
    const revenueChange =
      adjustment.expectedRevenue - adjustment.countedRevenue;

    const revenueForPointsMilestone =
      Math.floor(adjustment.expectedRevenue / 100000) * 100000;

    return {
      partnerId: adjustment.partnerId,
      occurredAt: adjustment.occurredAt,
      type: adjustment.direction as any, // INCREASE | DECREASE
      points: adjustment.deltaPoints,
      refType: LoyaltyPointRefTypeEnum.ADJUSTMENT,
      refId: adjustment.id,
      refCode: adjustment.code,
      revenueChange,
      accumulatedRevenue: adjustment.expectedRevenue,
      revenueForPointsMilestone,
      pointEarnRate: 100000,
    };
  }

  /**
   * Tính lại loyalty points từ một thời điểm
   */
  async recalculateFromDate(
    fromDate: Date,
    manager?: EntityManager,
    partnerIds?: string[],
  ): Promise<{
    deletedTransactions: number;
    replayedOrders: number;
    replayedAdjustments: number;
    totalReplayed: number;
  }> {
    const mainManager = manager || (await this.getManager());

    logger.info(
      `[LoyaltyPointRecalculate] Bắt đầu tính lại từ ${fromDate.toISOString()}`,
    );

    // ===== BƯỚC 1: XÓA TRANSACTION + SNAPSHOT =====
    const txDeleteQb = mainManager
      .getRepository(LoyaltyPointTransaction)
      .createQueryBuilder()
      .delete()
      .where("occurredAt >= :fromDate", { fromDate });
    if (partnerIds?.length) {
      txDeleteQb.andWhere("partnerId IN (:...partnerIds)", { partnerIds });
    }
    const deletedTransactions = (await txDeleteQb.execute()).affected || 0;

    const snapshotDeleteQb = mainManager
      .getRepository(LoyaltyPointSnapshot)
      .createQueryBuilder()
      .delete()
      .where("snapshotAt >= :fromDate", { fromDate });
    if (partnerIds?.length) {
      snapshotDeleteQb.andWhere("partnerId IN (:...partnerIds)", {
        partnerIds,
      });
    }
    await snapshotDeleteQb.execute();

    // ===== BƯỚC 2: LẤY DỮ LIỆU CẦN REPLAY =====
    const orderQb = mainManager
      .getRepository(Order)
      .createQueryBuilder("o")
      .where("o.orderAt >= :fromDate", { fromDate })
      .andWhere("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere("o.status = :status", { status: OrderStatusEnum.POSTED })
      .andWhere("o.partnerId IS NOT NULL")
      .andWhere("o.deletedAt IS NULL");
    if (partnerIds?.length) {
      orderQb.andWhere("o.partnerId IN (:...partnerIds)", { partnerIds });
    }
    const orders = await orderQb.getMany();

    // Lấy adjustments cần replay
    const adjustmentQb = mainManager
      .getRepository(LoyaltyPointAdjustment)
      .createQueryBuilder("a")
      .where("a.occurredAt >= :fromDate", { fromDate })
      .andWhere("a.deletedAt IS NULL");

    if (partnerIds?.length) {
      adjustmentQb.andWhere("a.partnerId IN (:...partnerIds)", { partnerIds });
    }

    const adjustments = await adjustmentQb.getMany();

    // ===== BƯỚC 3: MERGE + SORT =====
    const replayItems: ReplayItem[] = [
      ...orders.map((o) => ({
        type: "ORDER" as const,
        occurredAt: o.orderAt,
        data: o,
      })),
      ...adjustments.map((a) => ({
        type: "ADJUSTMENT" as const,
        occurredAt: a.occurredAt,
        data: a,
      })),
    ];

    replayItems.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    // ===== BƯỚC 4: REPLAY =====
    let replayedOrders = 0;
    let replayedAdjustments = 0;

    const collectPartnerIds = (items: ReplayItem[]): string[] => {
      const ids = items
        .map((item) => {
          if (item.type === "ORDER") {
            return (item.data as Order).partnerId;
          } else {
            return (item.data as LoyaltyPointAdjustment).partnerId;
          }
        })
        .filter(Boolean) as string[];

      return Array.from(new Set(ids));
    };

    const affectedPartnerIds: string[] =
      partnerIds && partnerIds.length > 0
        ? partnerIds
        : collectPartnerIds(replayItems);

    for (const item of replayItems) {
      switch (item.type) {
        case "ORDER":
          await this.replayOrder(item.data as Order, mainManager);
          replayedOrders++;
          break;
        case "ADJUSTMENT":
          await this.replayAdjustment(
            item.data as LoyaltyPointAdjustment,
            mainManager,
          );
          replayedAdjustments++;
          break;
      }
    }

    // ===== BƯỚC 5: CẬP NHẬT PARTNER BALANCE =====
    // Một số transaction tích điểm dùng occurredAt = orderAt + 1s để đảm bảo thứ tự
    // (tiêu điểm trước, tích điểm sau). Nếu đồng bộ tại `new Date()` ngay lúc replay,
    // có thể bỏ sót transaction vừa tạo nhưng có occurredAt nhỉnh hơn thời điểm hiện tại.
    const currentTime = new Date();

    const latestTxRows = affectedPartnerIds.length
      ? await mainManager
          .getRepository(LoyaltyPointTransaction)
          .createQueryBuilder("t")
          .select("t.partnerId", "partnerId")
          .addSelect("MAX(t.occurredAt)", "maxOccurredAt")
          .where("t.partnerId IN (:...partnerIds)", {
            partnerIds: affectedPartnerIds,
          })
          .andWhere("t.deletedAt IS NULL")
          .groupBy("t.partnerId")
          .getRawMany<{ partnerId: string; maxOccurredAt: string | null }>()
      : [];

    const latestOccurredAtByPartner = new Map<string, Date>();
    for (const row of latestTxRows) {
      if (!row.maxOccurredAt) continue;
      const maxOccurredAt = new Date(row.maxOccurredAt);
      if (Number.isNaN(maxOccurredAt.getTime())) continue;
      latestOccurredAtByPartner.set(row.partnerId, maxOccurredAt);
    }

    for (const pid of affectedPartnerIds) {
      if (!pid) continue;

      const latestOccurredAt = latestOccurredAtByPartner.get(pid);
      const balanceAt =
        latestOccurredAt && latestOccurredAt > currentTime
          ? latestOccurredAt
          : currentTime;

      const currentPoints = await this.getPointsAtDate(
        pid,
        balanceAt,
        mainManager,
      );
      const currentRevenue = await this.getTotalRevenueAtDate(
        pid,
        balanceAt,
        mainManager,
      );

      await mainManager.update(
        Partner,
        { id: pid },
        {
          loyaltyPoints: currentPoints,
          totalRevenue: currentRevenue,
        },
      );
    }

    // ===== BƯỚC 6: SNAPSHOT OPTIMIZED =====
    await this.rebuildSnapshotsOptimized(
      fromDate,
      mainManager,
      partnerIds || affectedPartnerIds,
    );

    logger.info(
      `[LoyaltyPointRecalculate] Hoàn thành tính lại từ ${fromDate.toISOString()}. Deleted transactions: ${deletedTransactions}, Replayed orders: ${replayedOrders}, Replayed adjustments: ${replayedAdjustments}`,
    );

    return {
      deletedTransactions,
      replayedOrders,
      replayedAdjustments,
      totalReplayed: replayedOrders + replayedAdjustments,
    };
  }

  /**
   * Replay Order
   * Idempotent: xoá transaction cũ của order này (nếu có) trước khi tạo mới,
   * tránh duplicate khi recalculate được gọi lại trên cùng khoảng thời gian.
   */
  private async replayOrder(
    data: Order,
    manager: EntityManager,
  ): Promise<void> {
    const transactions = await this.getTransactionDataByOrder(data, manager);
    if (transactions.length === 0) return;

    // Xoá transaction cũ cùng refId + refType để đảm bảo idempotent
    await manager.delete(LoyaltyPointTransaction, {
      refType: LoyaltyPointRefTypeEnum.ORDER,
      refId: data.id,
    });

    await manager.save(LoyaltyPointTransaction, transactions);
  }

  /**
   * Replay LoyaltyPointAdjustment
   * Idempotent: xoá transaction cũ của adjustment này trước khi tạo mới.
   */
  private async replayAdjustment(
    data: LoyaltyPointAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    // Tính lại bản ghi adjustment
    const countedPoints = await this.getPointsAtDate(
      data.partnerId,
      data.occurredAt,
      manager,
    );
    const countedRevenue = await this.getTotalRevenueAtDate(
      data.partnerId,
      data.occurredAt,
      manager,
    );
    const deltaPoints = Math.abs(data.expectedPoints - countedPoints);
    const direction =
      data.expectedPoints >= countedPoints
        ? LoyaltyPointTransactionTypeEnum.INCREASE
        : LoyaltyPointTransactionTypeEnum.DECREASE;

    const newAdjustment = {
      ...data,
      countedPoints,
      countedRevenue,
      deltaPoints,
      direction,
    } as LoyaltyPointAdjustment;

    await manager.save(LoyaltyPointAdjustment, newAdjustment);

    // Xoá transaction cũ của adjustment này (nếu có) — idempotent
    await manager.delete(LoyaltyPointTransaction, {
      refType: LoyaltyPointRefTypeEnum.ADJUSTMENT,
      refId: data.id,
    });

    if (deltaPoints === 0 && data.expectedRevenue === countedRevenue) return;

    await manager.save(
      LoyaltyPointTransaction,
      this.getTransactionDataByAdjustment(newAdjustment),
    );
  }

  /**
   * Tạo snapshot tháng
   */
  async createMonthlySnapshot(
    snapshotDate: Date,
    manager: EntityManager,
    partnerIds?: string[],
  ): Promise<void> {
    // Xóa snapshot cũ
    const deleteQb = manager
      .getRepository(LoyaltyPointSnapshot)
      .createQueryBuilder()
      .delete()
      .where("snapshotAt = :snapshotDate", { snapshotDate });

    if (partnerIds && partnerIds.length > 0) {
      deleteQb.andWhere("partnerId IN (:...partnerIds)", { partnerIds });
    }

    await deleteQb.execute();

    // Lấy tất cả transactions đến thời điểm snapshot để tính điểm
    const txQb = manager
      .createQueryBuilder(LoyaltyPointTransaction, "t")
      .where("t.occurredAt <= :snapshotDate", { snapshotDate })
      .andWhere("t.deletedAt IS NULL");

    if (partnerIds && partnerIds.length > 0) {
      txQb.andWhere("t.partnerId IN (:...partnerIds)", { partnerIds });
    }

    const transactions = await txQb.getMany();

    // Lấy tất cả orders đến thời điểm snapshot để tính revenue
    const orderQb = manager
      .createQueryBuilder(Order, "o")
      .where("o.orderAt <= :snapshotDate", { snapshotDate })
      .andWhere("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere("o.status = :status", { status: OrderStatusEnum.POSTED })
      .andWhere("o.partnerId IS NOT NULL")
      .andWhere("o.deletedAt IS NULL");

    if (partnerIds && partnerIds.length > 0) {
      orderQb.andWhere("o.partnerId IN (:...partnerIds)", { partnerIds });
    }

    const orders = await orderQb.getMany();

    // Tính điểm và revenue cho từng partner
    const partnerMap = new Map<
      string,
      { points: number; totalRevenue: number }
    >();

    // Tính điểm từ transactions
    for (const tx of transactions) {
      const current = partnerMap.get(tx.partnerId) || {
        points: 0,
        totalRevenue: 0,
      };

      if (tx.type === LoyaltyPointTransactionTypeEnum.INCREASE) {
        current.points += tx.points;
      } else {
        current.points -= tx.points;
      }

      partnerMap.set(tx.partnerId, current);
    }

    // Tính revenue từ orders (tránh duplicate khi 1 order tạo nhiều transactions)
    for (const order of orders) {
      if (!order.partnerId) continue;

      const current = partnerMap.get(order.partnerId) || {
        points: 0,
        totalRevenue: 0,
      };

      // Doanh thu = netAmount (không trừ loyalty discount)
      const revenue = order.netAmount;
      current.totalRevenue += revenue;

      partnerMap.set(order.partnerId, current);
    }

    // Lưu snapshots
    const snapshots: DeepPartial<LoyaltyPointSnapshot>[] = [];
    for (const [partnerId, data] of partnerMap.entries()) {
      snapshots.push({
        snapshotAt: snapshotDate,
        partnerId,
        points: data.points,
        totalRevenue: data.totalRevenue,
      });
    }

    if (snapshots.length > 0) {
      await manager.save(LoyaltyPointSnapshot, snapshots);
    }
  }

  /**
   * Rebuild snapshots optimized - Query một lần, tính incremental
   * Tối ưu hơn nhiều so với gọi createMonthlySnapshot nhiều lần
   */
  private async rebuildSnapshotsOptimized(
    fromDate: Date,
    manager: EntityManager,
    partnerIds: string[],
  ): Promise<void> {
    // ===== 1. Xác định các tháng cần snapshot =====
    const snapshotDates: Date[] = [];
    const isFirstDayOfMonth = fromDate.getDate() === 1;

    const start = isFirstDayOfMonth
      ? new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
      : new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1);
    const end = new Date();

    for (
      let d = start;
      d <= end;
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    ) {
      snapshotDates.push(new Date(d));
    }

    if (snapshotDates.length === 0) return;

    // ===== 2. Xóa snapshots cũ cho các tháng này =====
    for (const snapshotDate of snapshotDates) {
      const deleteQb = manager
        .getRepository(LoyaltyPointSnapshot)
        .createQueryBuilder()
        .delete()
        .where("snapshotAt = :snapshotDate", { snapshotDate });

      if (partnerIds.length > 0) {
        deleteQb.andWhere("partnerId IN (:...partnerIds)", { partnerIds });
      }

      await deleteQb.execute();
    }

    // ===== 3. Lấy snapshot trước tháng đầu tiên =====
    const beforeFirstMonth = new Date(start.getTime() - 1);
    const baseSnapshots = new Map<
      string,
      { points: number; totalRevenue: number }
    >();

    for (const partnerId of partnerIds) {
      const points = await this.getPointsAtDate(
        partnerId,
        beforeFirstMonth,
        manager,
      );
      const revenue = await this.getTotalRevenueAtDate(
        partnerId,
        beforeFirstMonth,
        manager,
      );

      baseSnapshots.set(partnerId, { points, totalRevenue: revenue });
    }

    // ===== 4. Query ALL transactions từ tháng đầu đến hiện tại =====
    const txQb = manager
      .createQueryBuilder(LoyaltyPointTransaction, "t")
      .where("t.occurredAt >= :start", { start })
      .andWhere("t.occurredAt <= :end", { end })
      .andWhere("t.deletedAt IS NULL")
      .orderBy("t.occurredAt", "ASC");

    if (partnerIds.length > 0) {
      txQb.andWhere("t.partnerId IN (:...partnerIds)", { partnerIds });
    }

    const transactions = await txQb.getMany();

    // ===== 5. Query ALL orders từ tháng đầu đến hiện tại =====
    const orderQb = manager
      .createQueryBuilder(Order, "o")
      .where("o.orderAt >= :start", { start })
      .andWhere("o.orderAt <= :end", { end })
      .andWhere("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere("o.status = :status", { status: OrderStatusEnum.POSTED })
      .andWhere("o.partnerId IS NOT NULL")
      .andWhere("o.deletedAt IS NULL")
      .orderBy("o.orderAt", "ASC");

    if (partnerIds.length > 0) {
      orderQb.andWhere("o.partnerId IN (:...partnerIds)", { partnerIds });
    }

    const orders = await orderQb.getMany();

    // ===== 6. Tính snapshots incremental cho từng tháng =====
    // Clone base snapshots cho tháng đầu tiên
    const currentState = new Map<
      string,
      { points: number; totalRevenue: number }
    >();

    for (const [pid, data] of baseSnapshots) {
      currentState.set(pid, { ...data });
    }

    // Initialize cho partners chưa có base snapshot
    for (const pid of partnerIds) {
      if (!currentState.has(pid)) {
        currentState.set(pid, { points: 0, totalRevenue: 0 });
      }
    }

    const allSnapshotsToSave: DeepPartial<LoyaltyPointSnapshot>[] = [];

    for (let i = 0; i < snapshotDates.length; i++) {
      const snapshotAt = snapshotDates[i];
      const nextSnapshotAt =
        i < snapshotDates.length - 1
          ? snapshotDates[i + 1]
          : new Date(end.getTime() + 86400000); // +1 day

      // Áp dụng transactions trong tháng này
      const txThisMonth = transactions.filter(
        (tx) => tx.occurredAt >= snapshotAt && tx.occurredAt < nextSnapshotAt,
      );

      for (const tx of txThisMonth) {
        const current = currentState.get(tx.partnerId);
        if (!current) continue;

        if (tx.type === LoyaltyPointTransactionTypeEnum.INCREASE) {
          current.points += tx.points;
        } else {
          current.points -= tx.points;
        }
      }

      // Áp dụng orders trong tháng này
      const ordersThisMonth = orders.filter(
        (o) => o.orderAt >= snapshotAt && o.orderAt < nextSnapshotAt,
      );

      for (const order of ordersThisMonth) {
        if (!order.partnerId) continue;

        const current = currentState.get(order.partnerId);
        if (!current) continue;

        current.totalRevenue += order.netAmount;
      }

      // Save snapshot cho tháng này
      for (const [partnerId, data] of currentState) {
        allSnapshotsToSave.push({
          snapshotAt,
          partnerId,
          points: data.points,
          totalRevenue: data.totalRevenue,
        });
      }
    }

    // ===== 7. Lưu tất cả snapshots =====
    if (allSnapshotsToSave.length > 0) {
      // Batch save
      const BATCH_SIZE = 500;
      for (let i = 0; i < allSnapshotsToSave.length; i += BATCH_SIZE) {
        const batch = allSnapshotsToSave.slice(i, i + BATCH_SIZE);
        await manager.save(LoyaltyPointSnapshot, batch);
      }

      // logger.info(
      //   `[LoyaltyPointRecalculate] Đã tạo ${allSnapshotsToSave.length} snapshots cho ${snapshotDates.length} tháng`,
      // );
    }
  }

  /**
   * Lấy số điểm tại một thời điểm
   */
  async getPointsAtDate(
    partnerId: string,
    atDate: Date,
    manager: EntityManager,
  ): Promise<number> {
    // Lấy snapshot gần nhất
    const snapshot = await manager
      .getRepository(LoyaltyPointSnapshot)
      .createQueryBuilder("s")
      .where("s.partnerId = :partnerId", { partnerId })
      .andWhere("s.snapshotAt <= :atDate", { atDate })
      .andWhere("s.deletedAt IS NULL")
      .orderBy("s.snapshotAt", "DESC")
      .getOne();

    let points = snapshot ? snapshot.points : 0;

    const txs = await manager
      .getRepository(LoyaltyPointTransaction)
      .createQueryBuilder("t")
      .where("t.partnerId = :partnerId", { partnerId })
      .andWhere("t.occurredAt > :snapshotAt", {
        snapshotAt: snapshot ? snapshot.snapshotAt : new Date(0),
      })
      .andWhere("t.occurredAt <= :atDate", { atDate })
      .andWhere("t.deletedAt IS NULL")
      .getMany();

    for (const tx of txs) {
      if (tx.type === LoyaltyPointTransactionTypeEnum.INCREASE) {
        points += tx.points;
      } else {
        points -= tx.points;
      }
    }

    return points;
  }

  /**
   * Lấy tổng doanh số tại một thời điểm
   * Optimized: Sử dụng accumulatedRevenue từ transaction gần nhất
   */
  async getTotalRevenueAtDate(
    partnerId: string,
    atDate: Date,
    manager: EntityManager,
  ): Promise<number> {
    // Tìm transaction gần nhất có thay đổi revenue
    const lastTx = await manager
      .getRepository(LoyaltyPointTransaction)
      .createQueryBuilder("t")
      .where("t.partnerId = :partnerId", { partnerId })
      .andWhere("t.occurredAt <= :atDate", { atDate })
      .orderBy("t.occurredAt", "DESC")
      .addOrderBy("t.createdAt", "DESC")
      .andWhere("t.deletedAt IS NULL")
      .getOne();

    // Nếu không có transaction nào, revenue = 0
    return lastTx?.accumulatedRevenue || 0;
  }
}
