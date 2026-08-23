import { inject, injectable } from "inversify";
import { Brackets, DeepPartial, EntityManager } from "typeorm";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { Order } from "@/database/models/store/Order";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { INVENTORY_TYPES } from "./inventory.types";
import { StockMetadataHelper } from "./stockMetadata.helper";
import logger from "@/shared/utils/logger";
import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";
import {
  InventoryRefTypeEnum,
  InventoryTransactionType,
  OrderLineTypeEnum,
  OrderStatusEnum,
  OrderTypeEnum,
} from "@/shared/constants/enum";
import { TransactionService } from "@/shared/base/TransactionService";
import { OrderLine } from "@/database/models/store/OrderLine";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";

export interface InventoryRecalculateNode {
  variantId: string;
  storeId: string;
  fromDate: Date | string;
}

/**
 * Interface cho các phiếu cần replay
 */
interface ReplayItem {
  type: "ORDER" | "TRANSFER" | "ADJUSTMENT";
  occurredAt: Date;
  data: Order | StoreTransfer | InventoryAdjustment;
}
interface ReplayItemLine {
  type: "ORDER_LINE" | "TRANSFER_LINE" | "ADJUSTMENT_LINE";
  occurredAt: Date;
  data: OrderLine | StoreTransferLine | InventoryAdjustmentLine;
}

/**
 * Inventory Recalculate Service
 * Ghi lại toàn bộ transaction từ một thời điểm khi cần sửa phiếu cũ
 */
@injectable()
export class InventoryRecalculateService extends TransactionService {
  private currentStoreId?: string;
  private replaySavepointCounter = 0;

  constructor(
    @inject(INVENTORY_TYPES.StockMetadataHelper)
    private stockMetadataHelper: StockMetadataHelper,
  ) {
    super();
  }

  private nextReplaySavepointName(): string {
    this.replaySavepointCounter += 1;
    return `sp_inventory_recalculate_${this.replaySavepointCounter}`;
  }

  private isDeadlockError(error: unknown): boolean {
    const pgCode = (error as any)?.code || (error as any)?.driverError?.code;
    const message = error instanceof Error ? error.message : String(error);
    return pgCode === "40P01" || /deadlock detected/i.test(message);
  }

  private async runWithReplaySavepoint(
    manager: EntityManager,
    operation: () => Promise<void>,
  ): Promise<void> {
    const queryRunner = manager.queryRunner;
    if (!queryRunner?.isTransactionActive) {
      await operation();
      return;
    }

    const savepoint = this.nextReplaySavepointName();

    await manager.query(`SAVEPOINT ${savepoint}`);
    try {
      await operation();
      await manager.query(`RELEASE SAVEPOINT ${savepoint}`);
    } catch (error) {
      await manager.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      await manager.query(`RELEASE SAVEPOINT ${savepoint}`);
      throw error;
    }
  }

  private async replayWithRetry(
    manager: EntityManager,
    label: string,
    operation: () => Promise<void>,
    maxDeadlockRetries = 2,
  ): Promise<void> {
    let attempt = 0;

    while (true) {
      try {
        await this.runWithReplaySavepoint(manager, operation);
        return;
      } catch (error) {
        if (!this.isDeadlockError(error) || attempt >= maxDeadlockRetries) {
          throw error;
        }

        attempt += 1;
        logger.warn(
          `[RECALCULATE] Deadlock khi replay ${label}, thử lại lần ${attempt}/${maxDeadlockRetries}`,
        );
      }
    }
  }

  /**
   * HÀM 1: Ghi lại transaction từ thời điểm X
   *
   * Khi sửa một phiếu có occurredAt = A:
   * 1. Xóa tất cả transaction có occurredAt >= A
   * 2. Xóa tất cả stockTracking có occurredAt >= A
   * 3. Lấy tất cả phiếu (Order, Transfer, Adjustment) có occurredAt >= A
   * 4. Sắp xếp theo occurredAt
   * 5. Replay lần lượt theo thứ tự thời gian (đúng như thực tế)
   *
   * @param fromDate Thời điểm X (occurredAt của phiếu bị sửa)
   * @param manager EntityManager (PHẢI trong transaction)
   */
  async recalculateFromDate(
    fromDate: Date,
    manager?: EntityManager,
  ): Promise<{
    deletedTransactions: number;
    replayedOrders: number;
    replayedTransfers: number;
    replayedAdjustments: number;
    totalReplayed: number;
  }> {
    const mainManager = manager || (await this.getManager());
    const effectiveFromDate = new Date(fromDate);
    effectiveFromDate.setMilliseconds(0);

    logger.info(
      `[INVENTORY_RECALCULATE] Bắt đầu ghi lại tồn kho từ ${effectiveFromDate.toISOString()} (input=${fromDate.toISOString()})`,
    );

    const deletedTxResult = await mainManager
      .getRepository(InventoryTransaction)
      .createQueryBuilder()
      .delete()
      .where("occurredAt >= :fromDate", { fromDate: effectiveFromDate })
      .execute();
    const deletedTransactions = deletedTxResult.affected || 0;
    logger.info(
      `[INVENTORY_RECALCULATE] Đã xóa ${deletedTransactions} transaction có occurredAt >= ${effectiveFromDate.toISOString()}`,
    );

    // ===== BƯỚC 1: LẤY TẤT CẢ PHIẾU CẦN REPLAY =====
    logger.info("[INVENTORY_RECALCULATE] Bước 1: Lấy tất cả phiếu cần replay");

    const [orders, transfers, adjustments] = await Promise.all([
      // Lấy Orders có orderAt >= fromDate
      mainManager
        .createQueryBuilder(Order, "o")
        .leftJoinAndSelect("o.lines", "lines", "lines.deletedAt IS NULL")
        .leftJoinAndSelect("lines.productVariant", "productVariant")
        .where("o.deletedAt IS NULL")
        .andWhere("o.orderAt IS NOT NULL")
        .andWhere("o.status = :status", { status: OrderStatusEnum.POSTED })
        .andWhere("o.orderAt >= :fromDate", { fromDate: effectiveFromDate })
        .orderBy("o.orderAt", "ASC")
        .getMany(),

      // Lấy Transfers có occurredAt >= fromDate

      mainManager
        .createQueryBuilder(StoreTransfer, "t")
        .leftJoinAndSelect("t.lines", "lines", "lines.deletedAt IS NULL")
        .leftJoinAndSelect("lines.productVariant", "productVariant")
        .where("t.deletedAt IS NULL")
        .andWhere("t.occurredAt >= :fromDate", { fromDate: effectiveFromDate })
        .orderBy("t.occurredAt", "ASC")
        .getMany(),

      // Lấy Adjustments có occurredAt >= fromDate
      mainManager
        .createQueryBuilder(InventoryAdjustment, "a")
        .leftJoinAndSelect("a.lines", "lines", "lines.deletedAt IS NULL")
        .leftJoinAndSelect("lines.productVariant", "productVariant")
        .where("a.deletedAt IS NULL")
        .andWhere("a.occurredAt >= :fromDate", { fromDate: effectiveFromDate })
        .orderBy("a.occurredAt", "ASC")
        .getMany(),
    ]);

    // ===== BƯỚC 4: MERGE VÀ SORT THEO THỜI GIAN =====
    logger.info(
      "[INVENTORY_RECALCULATE] Bước 2: Merge và sort theo occurredAt",
    );

    const replayItems: ReplayItem[] = [
      ...orders.map((o) => ({
        type: "ORDER" as const,
        occurredAt: o.orderAt!,
        data: o,
      })),
      ...transfers.map((t) => ({
        type: "TRANSFER" as const,
        occurredAt: t.occurredAt,
        data: t,
      })),
      ...adjustments.map((a) => ({
        type: "ADJUSTMENT" as const,
        occurredAt: a.occurredAt,
        data: a,
      })),
    ];

    // Sort theo occurredAt (cũ nhất trước)
    replayItems.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    logger.info(
      `[INVENTORY_RECALCULATE] Tổng ${replayItems.length} phiếu cần replay`,
    );

    // ===== BƯỚC 5: REPLAY TỪNG PHIẾU THEO THỨ TỰ THỜI GIAN =====
    logger.info("[INVENTORY_RECALCULATE] Bước 3: Replay từng phiếu");

    let replayedOrders = 0;
    let replayedTransfers = 0;
    let replayedAdjustments = 0;
    const replayErrors: string[] = [];

    for (const item of replayItems) {
      try {
        await this.replayWithRetry(
          mainManager,
          `${item.type}:${item.data.code || "N/A"}`,
          async () => {
            if (item.type === "ORDER") {
              await this.replayOrder(item.data as Order, mainManager);
              replayedOrders++;
            } else if (item.type === "TRANSFER") {
              await this.replayTransfer(
                item.data as StoreTransfer,
                mainManager,
              );
              replayedTransfers++;
            } else if (item.type === "ADJUSTMENT") {
              await this.replayAdjustment(
                item.data as InventoryAdjustment,
                mainManager,
              );
              replayedAdjustments++;
            }
          },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const replayError = `[${item.type}] code=${item.data.code}, occurredAt=${item.occurredAt.toISOString()}, error=${errorMessage}`;

        replayErrors.push(replayError);
        logger.error(
          `[RECALCULATE] Lỗi khi replay ${item.type}: ${item.data.code} at ${item.occurredAt}:`,
          error,
        );
        continue;
      }
    }

    if (replayErrors.length > 0) {
      const aggregateMessage =
        `[RECALCULATE] Có ${replayErrors.length} lỗi khi replay từ ${effectiveFromDate.toISOString()}:\n` +
        replayErrors.join("\n");

      logger.error(aggregateMessage);
      throw new Error(aggregateMessage);
    }

    // ===== BƯỚC 6: Tạo lại snapshot hiện tại =====
    logger.info(
      "[INVENTORY_RECALCULATE] Bước 4: Tạo lại inventory snapshot hiện tại",
    );
    await this.recomputeRunningInventoryStateFromDate(
      effectiveFromDate,
      mainManager,
    );

    // ===== BƯỚC 7: 🚀 Đồng bộ stockMetadata cho tất cả variants bị ảnh hưởng =====
    // Collect tất cả variantIds từ replayItems
    const affectedVariantIds = new Set<string>();

    for (const item of replayItems) {
      if (item.type === "ORDER") {
        const order = item.data as Order;
        order.lines?.forEach((line) => {
          if (line.productVariantId)
            affectedVariantIds.add(line.productVariantId);
        });
      } else if (item.type === "TRANSFER") {
        const transfer = item.data as StoreTransfer;
        transfer.lines?.forEach((line) => {
          if (line.productVariantId)
            affectedVariantIds.add(line.productVariantId);
        });
      } else if (item.type === "ADJUSTMENT") {
        const adjustment = item.data as InventoryAdjustment;
        adjustment.lines?.forEach((line) => {
          if (line.productVariantId)
            affectedVariantIds.add(line.productVariantId);
        });
      }
    }

    const variantIdsArray = Array.from(affectedVariantIds);
    if (variantIdsArray.length > 0) {
      logger.info(
        `[INVENTORY_RECALCULATE] Đồng bộ stockMetadata cho ${variantIdsArray.length} variant(s) và products cha...`,
      );
      await this.stockMetadataHelper.batchUpdateCascadeToProducts(
        variantIdsArray,
        mainManager,
      );
      logger.info(
        `[INVENTORY_RECALCULATE] ✅ Đã đồng bộ stockMetadata (variants + products) thành công!`,
      );
    }

    // KHÔNG xóa các lô quantityRemaining = 0.
    // Các lô đã xuất hết vẫn cần tồn tại để reverse FIFO khi recalculate từ mốc quá khứ.

    logger.info("[INVENTORY_RECALCULATE] Hoàn thành!");

    return {
      deletedTransactions,
      replayedOrders,
      replayedTransfers,
      replayedAdjustments,
      totalReplayed: replayedOrders + replayedTransfers + replayedAdjustments,
    };
  }

  /**
   * Thống kê tất cả các cặp (variantId, storeId) bị ảnh hưởng khi có thay đổi,
   * bao gồm cả các kho liên quan qua StoreTransfer.
   *
   * Logic lan truyền qua storeTransfer:
   * - Nếu fromStore đã bị ảnh hưởng và có transfer xảy ra sau fromDate → toStore cũng bị ảnh hưởng
   * - Ngược lại, nếu toStore đã bị ảnh hưởng → fromStore cũng bị ảnh hưởng
   */
  async collectAffectedInventoryNodes(
    nodes: InventoryRecalculateNode[],
    manager?: EntityManager,
  ): Promise<Array<{ variantId: string; storeId: string; fromDate: Date }>> {
    if (!nodes?.length) {
      return [];
    }

    const mainManager = manager || (await this.getManager());

    const nodesByVariant = new Map<string, Map<string, Date>>();

    for (const node of nodes) {
      if (!node.variantId || !node.storeId || !node.fromDate) {
        continue;
      }

      const normalizedFromDate = new Date(node.fromDate);
      if (Number.isNaN(normalizedFromDate.getTime())) {
        continue;
      }
      normalizedFromDate.setMilliseconds(0);

      const storesMap =
        nodesByVariant.get(node.variantId) || new Map<string, Date>();
      const existingFromDate = storesMap.get(node.storeId);

      if (!existingFromDate || normalizedFromDate < existingFromDate) {
        storesMap.set(node.storeId, normalizedFromDate);
      }

      nodesByVariant.set(node.variantId, storesMap);
    }

    for (const [variantId, affectedStoresMap] of nodesByVariant.entries()) {
      const fromDates = Array.from(affectedStoresMap.values());
      if (!fromDates.length) {
        continue;
      }

      const minFromDate = new Date(
        Math.min(...fromDates.map((d) => d.getTime())),
      );

      const transferLines = await mainManager
        .createQueryBuilder(StoreTransferLine, "stl")
        .leftJoinAndSelect("stl.transfer", "t")
        .where("stl.productVariantId = :variantId", { variantId })
        .andWhere("t.occurredAt >= :fromDate", { fromDate: minFromDate })
        .andWhere("stl.deletedAt IS NULL")
        .andWhere("t.deletedAt IS NULL")
        .orderBy("t.occurredAt", "ASC")
        .getMany();

      for (const line of transferLines) {
        const transfer = line.transfer;
        if (!transfer) {
          continue;
        }

        const transferAt = new Date(transfer.occurredAt);
        transferAt.setMilliseconds(0);

        const sourceKnownAt = affectedStoresMap.get(transfer.fromStoreId);
        const targetKnownAt = affectedStoresMap.get(transfer.toStoreId);

        if (sourceKnownAt && sourceKnownAt <= transferAt) {
          const currentTargetAt = affectedStoresMap.get(transfer.toStoreId);
          if (!currentTargetAt || transferAt < currentTargetAt) {
            affectedStoresMap.set(transfer.toStoreId, transferAt);
          }
        }

        if (targetKnownAt && targetKnownAt <= transferAt) {
          const currentSourceAt = affectedStoresMap.get(transfer.fromStoreId);
          if (!currentSourceAt || transferAt < currentSourceAt) {
            affectedStoresMap.set(transfer.fromStoreId, transferAt);
          }
        }
      }
    }

    const result: Array<{
      variantId: string;
      storeId: string;
      fromDate: Date;
    }> = [];

    for (const [variantId, affectedStoresMap] of nodesByVariant.entries()) {
      for (const [storeId, fromDate] of affectedStoresMap.entries()) {
        result.push({ variantId, storeId, fromDate });
      }
    }

    result.sort((a, b) => {
      if (a.variantId !== b.variantId) {
        return a.variantId.localeCompare(b.variantId);
      }
      return a.fromDate.getTime() - b.fromDate.getTime();
    });

    return result;
  }

  /**
   * HÀM 2: Ghi lại transaction từ thời điểm X cho một cặp variant + store cụ thể
   *
   * @param variantId
   * @param storeId
   * @param fromDate Thời điểm X (occurredAt của phiếu bị sửa)
   * @param manager EntityManager (PHẢI trong transaction)
   */
  async recalculateVariantStoreFromDate(
    variantId: string,
    storeId: string,
    fromDate: Date,
    manager?: EntityManager,
  ): Promise<void> {
    const mainManager = manager || (await this.getManager());

    // ⚠️ Set currentStoreId để replayTransferLine biết đang recalculate store nào
    this.currentStoreId = storeId;

    logger.info(
      `[INVENTORY_RECALCULATE] Bắt đầu ghi lại tồn kho cho variant ${variantId.substring(0, 8)}... tại store ${storeId.substring(0, 8)}... từ ${fromDate.toISOString()}`,
    );

    // ===== FAST PATH: Kiểm tra có transaction nào >= fromDate không =====
    // Nếu không có (đây là transaction mới nhất, thường là đơn bán hàng orderAt = now),
    // thì bỏ qua bước DELETE + full replay, chỉ append transactions mới.
    const existingTxCount: [{ count: string }] = await mainManager.query(
      `SELECT COUNT(*) as count FROM inventory_transactions
       WHERE "productVariantId" = $1 AND "storeId" = $2
         AND "occurredAt" >= $3 AND "deletedAt" IS NULL`,
      [variantId, storeId, fromDate],
    );
    const hasTxToReplace = parseInt(existingTxCount[0]?.count || "0", 10) > 0;

    if (!hasTxToReplace) {
      // Fast path: chỉ append transactions mới, không cần xóa hay replay toàn bộ
      logger.info(
        `[INVENTORY_RECALCULATE] Fast path (append-only) cho variant ${variantId.substring(0, 8)}... store ${storeId.substring(0, 8)}...`,
      );
      await this._appendNewTransactions(
        variantId,
        storeId,
        fromDate,
        mainManager,
      );
      this.currentStoreId = undefined;
      return;
    }

    // ===== BƯỚC 2: XÓA DỮ LIỆU CŨ =====
    await mainManager
      .getRepository(InventoryTransaction)
      .createQueryBuilder()
      .delete()
      .where("occurredAt >= :fromDate", { fromDate })
      .andWhere("productVariantId = :variantId", { variantId })
      .andWhere("storeId = :storeId", { storeId })
      .andWhere("deletedAt IS NULL")
      .execute();

    // ===== BƯỚC 3: LẤY TẤT CẢ PHIẾU CẦN REPLAY CHO VARIANT + STORE NÀY (LINES) =====
    const [orderLines, transferLines, adjustmentLines] = await Promise.all([
      // Lấy OrderLines có orderAt >= fromDate và variant + store khớp
      mainManager
        .createQueryBuilder(OrderLine, "ol")
        .leftJoinAndSelect("ol.order", "o")
        .where("o.orderAt >= :fromDate", { fromDate })
        .andWhere("ol.productVariantId = :variantId", { variantId })
        .andWhere("o.status = :status", { status: OrderStatusEnum.POSTED })
        .andWhere("o.storeId = :storeId", { storeId })
        .andWhere("ol.deletedAt IS NULL")
        .getMany(),

      // Lấy StoreTransferLines có occurredAt >= fromDate và variant + store khớp (store khớp là kho xuất hoặc kho nhận)
      mainManager
        .createQueryBuilder(StoreTransferLine, "stl")
        .leftJoinAndSelect("stl.transfer", "t")
        .where("t.occurredAt >= :fromDate", { fromDate })
        .andWhere("stl.productVariantId = :variantId", { variantId })
        .andWhere(
          new Brackets((qb) => {
            qb.where("t.fromStoreId = :storeId", { storeId }).orWhere(
              "t.toStoreId = :storeId",
              { storeId },
            );
          }),
        )
        .andWhere("stl.deletedAt IS NULL")
        .getMany(),

      // Lấy InventoryAdjustmentLines có occurredAt >= fromDate và variant + store khớp
      mainManager
        .createQueryBuilder(InventoryAdjustmentLine, "ial")
        .leftJoinAndSelect("ial.adjustment", "a")
        .where("a.occurredAt >= :fromDate", { fromDate })
        .andWhere("ial.productVariantId = :variantId", { variantId })
        .andWhere("a.storeId = :storeId", { storeId })
        .andWhere("ial.deletedAt IS NULL")
        .getMany(),
    ]);

    // ===== BƯỚC 4: MERGE VÀ SORT THEO THỜI GIAN =====
    const replayItems: ReplayItemLine[] = [
      ...orderLines.map((ol) => ({
        type: "ORDER_LINE" as const,
        occurredAt: ol.order.orderAt!,
        data: ol,
      })),
      ...transferLines.map((stl) => ({
        type: "TRANSFER_LINE" as const,
        occurredAt: stl.transfer.occurredAt,
        data: stl,
      })),
      ...adjustmentLines.map((ial) => ({
        type: "ADJUSTMENT_LINE" as const,
        occurredAt: ial.adjustment.occurredAt,
        data: ial,
      })),
    ];

    // Sort theo occurredAt (cũ nhất trước)
    replayItems.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    // ===== BƯỚC 5: REPLAY TỪNG PHIẾU THEO THỨ TỰ THỜI GIAN =====
    const replayErrors: string[] = [];
    for (const item of replayItems) {
      try {
        await this.replayWithRetry(
          mainManager,
          `${item.type}:${item.occurredAt.toISOString()}`,
          async () => {
            if (item.type === "ORDER_LINE") {
              await this.replayOrderLine(item.data as OrderLine, mainManager);
            } else if (item.type === "TRANSFER_LINE") {
              await this.replayTransferLine(
                item.data as StoreTransferLine,
                mainManager,
              );
            } else if (item.type === "ADJUSTMENT_LINE") {
              await this.replayAdjustmentLine(
                item.data as InventoryAdjustmentLine,
                mainManager,
              );
            }
          },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const sourceCode =
          item.type === "ORDER_LINE"
            ? (item.data as OrderLine).order?.code
            : item.type === "TRANSFER_LINE"
              ? (item.data as StoreTransferLine).transfer?.code
              : (item.data as InventoryAdjustmentLine).adjustment?.code;

        const replayError = `[${item.type}] code=${sourceCode || "N/A"}, occurredAt=${item.occurredAt.toISOString()}, error=${errorMessage}`;

        replayErrors.push(replayError);
        logger.error(
          `[RECALCULATE] Lỗi khi replay ${item.type} at ${item.occurredAt}:`,
          error,
        );
        continue;
      }
    }

    if (replayErrors.length > 0) {
      const aggregateMessage =
        `[RECALCULATE] Có ${replayErrors.length} lỗi khi replay variant=${variantId}, store=${storeId}, fromDate=${fromDate.toISOString()}:\n` +
        replayErrors.join("\n");

      logger.error(aggregateMessage);
      throw new Error(aggregateMessage);
    }

    // ===== BƯỚC 6: Cập nhật quantityAfter/inventoryValueAfter/averageCostAfter trên transactions =====
    await this.recomputeRunningInventoryStateFromDate(
      fromDate,
      mainManager,
      variantId,
      storeId,
    );

    logger.info(
      "[INVENTORY_RECALCULATE] Hoàn thành cho variant + store cụ thể!",
    );

    // ===== 🚀 Đồng bộ stockMetadata cho variant và product cha =====
    logger.info(
      `[INVENTORY_RECALCULATE] Đồng bộ stockMetadata cho variant ${variantId.substring(0, 8)}... và product cha`,
    );
    await this.stockMetadataHelper.updateCascadeToProduct(
      variantId,
      mainManager,
    );
    logger.info(
      `[INVENTORY_RECALCULATE] ✅ Đã đồng bộ stockMetadata (variant + product) thành công!`,
    );

    // Reset currentStoreId
    this.currentStoreId = undefined;
  }

  /**
   * Fast path: chỉ ghi transaction mới cho các phiếu chưa có transaction.
   * Dùng khi fromDate >= thời điểm transaction cuối cùng (đơn mới nhất, không cần xóa/replay).
   */
  private async _appendNewTransactions(
    variantId: string,
    storeId: string,
    fromDate: Date,
    manager: EntityManager,
  ): Promise<void> {
    // Lấy refId đã có transaction để loại trừ (tránh ghi 2 lần)
    const existingRefs: { refId: string }[] = await manager.query(
      `SELECT DISTINCT "refId" FROM inventory_transactions
       WHERE "productVariantId" = $1 AND "storeId" = $2 AND "deletedAt" IS NULL`,
      [variantId, storeId],
    );
    const existingRefIds = new Set(existingRefs.map((r) => r.refId));

    const [orderLines, transferLines, adjustmentLines] = await Promise.all([
      manager
        .createQueryBuilder(OrderLine, "ol")
        .leftJoinAndSelect("ol.order", "o")
        .where("o.orderAt >= :fromDate", { fromDate })
        .andWhere("ol.productVariantId = :variantId", { variantId })
        .andWhere("o.status = :status", { status: OrderStatusEnum.POSTED })
        .andWhere("o.storeId = :storeId", { storeId })
        .andWhere("ol.deletedAt IS NULL")
        .getMany(),

      manager
        .createQueryBuilder(StoreTransferLine, "stl")
        .leftJoinAndSelect("stl.transfer", "t")
        .where("t.occurredAt >= :fromDate", { fromDate })
        .andWhere("stl.productVariantId = :variantId", { variantId })
        .andWhere(
          new Brackets((qb) => {
            qb.where("t.fromStoreId = :storeId", { storeId }).orWhere(
              "t.toStoreId = :storeId",
              { storeId },
            );
          }),
        )
        .andWhere("stl.deletedAt IS NULL")
        .getMany(),

      manager
        .createQueryBuilder(InventoryAdjustmentLine, "ial")
        .leftJoinAndSelect("ial.adjustment", "a")
        .where("a.occurredAt >= :fromDate", { fromDate })
        .andWhere("ial.productVariantId = :variantId", { variantId })
        .andWhere("a.storeId = :storeId", { storeId })
        .andWhere("ial.deletedAt IS NULL")
        .getMany(),
    ]);

    // Chỉ lấy những phiếu chưa có transaction
    const replayItems: ReplayItemLine[] = [
      ...orderLines
        .filter((ol) => !existingRefIds.has(ol.order.id))
        .map((ol) => ({
          type: "ORDER_LINE" as const,
          occurredAt: ol.order.orderAt!,
          data: ol,
        })),
      ...transferLines
        .filter((stl) => !existingRefIds.has(stl.transfer.id))
        .map((stl) => ({
          type: "TRANSFER_LINE" as const,
          occurredAt: stl.transfer.occurredAt,
          data: stl,
        })),
      ...adjustmentLines
        .filter((ial) => !existingRefIds.has(ial.adjustment.id))
        .map((ial) => ({
          type: "ADJUSTMENT_LINE" as const,
          occurredAt: ial.adjustment.occurredAt,
          data: ial,
        })),
    ];

    if (replayItems.length === 0) {
      logger.info(
        `[INVENTORY_RECALCULATE] Fast path: không có phiếu mới cần ghi transaction`,
      );
      await this.stockMetadataHelper.updateCascadeToProduct(variantId, manager);
      return;
    }

    replayItems.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    const replayErrors: string[] = [];
    for (const item of replayItems) {
      try {
        await this.replayWithRetry(
          manager,
          `${item.type}:${item.occurredAt.toISOString()}`,
          async () => {
            if (item.type === "ORDER_LINE") {
              await this.replayOrderLine(item.data as OrderLine, manager);
            } else if (item.type === "TRANSFER_LINE") {
              await this.replayTransferLine(
                item.data as StoreTransferLine,
                manager,
              );
            } else if (item.type === "ADJUSTMENT_LINE") {
              await this.replayAdjustmentLine(
                item.data as InventoryAdjustmentLine,
                manager,
              );
            }
          },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        replayErrors.push(
          `[${item.type}] occurredAt=${item.occurredAt.toISOString()}, error=${errorMessage}`,
        );
        logger.error(
          `[RECALCULATE] Fast path lỗi khi replay ${item.type} at ${item.occurredAt}:`,
          error,
        );
      }
    }

    if (replayErrors.length > 0) {
      throw new Error(
        `[RECALCULATE] Fast path có ${replayErrors.length} lỗi:\n` +
          replayErrors.join("\n"),
      );
    }

    logger.info(
      `[INVENTORY_RECALCULATE] Fast path: đã ghi ${replayItems.length} transaction(s) mới`,
    );
    await this.stockMetadataHelper.updateCascadeToProduct(variantId, manager);
  }

  private async recomputeRunningInventoryStateFromDate(
    fromDate: Date,
    manager: EntityManager,
    onlyVariantId?: string,
    onlyStoreId?: string,
  ): Promise<void> {
    const txs = await manager
      .createQueryBuilder(InventoryTransaction, "it")
      .where("it.occurredAt >= :fromDate", { fromDate })
      .andWhere("it.deletedAt IS NULL")
      .andWhere(
        onlyVariantId ? "it.productVariantId = :onlyVariantId" : "1=1",
        { onlyVariantId },
      )
      .andWhere(onlyStoreId ? "it.storeId = :onlyStoreId" : "1=1", {
        onlyStoreId,
      })
      .orderBy("it.productVariantId", "ASC")
      .addOrderBy("it.storeId", "ASC")
      .addOrderBy("it.occurredAt", "ASC")
      .addOrderBy("it.createdAt", "ASC")
      .addOrderBy("it.id", "ASC")
      .getMany();

    const stateMap = new Map<
      string,
      { quantity: number; value: number; average: number; initialized: boolean }
    >();

    for (const tx of txs) {
      const key = `${tx.productVariantId}|${tx.storeId}`;
      let state = stateMap.get(key);

      if (!state) {
        const prevTx = await manager
          .createQueryBuilder(InventoryTransaction, "it")
          .where("it.productVariantId = :productVariantId", {
            productVariantId: tx.productVariantId,
          })
          .andWhere("it.storeId = :storeId", { storeId: tx.storeId })
          .andWhere("it.deletedAt IS NULL")
          .andWhere("it.occurredAt < :fromDate", { fromDate })
          .orderBy("it.occurredAt", "DESC")
          .addOrderBy("it.createdAt", "DESC")
          .addOrderBy("it.id", "DESC")
          .getOne();

        const baseQty = prevTx?.quantityAfter ?? 0;
        const baseValue = prevTx?.inventoryValueAfter ?? 0;
        const baseAvg =
          baseQty !== 0
            ? baseValue / baseQty
            : prevTx?.averageCostAfter != null
              ? prevTx.averageCostAfter
              : 0;

        state = {
          quantity: baseQty,
          value: baseValue,
          average: baseAvg,
          initialized: true,
        };
        stateMap.set(key, state);
      }

      const sign = tx.type === InventoryTransactionType.IN ? 1 : -1;
      state.quantity += sign * tx.quantity;
      state.value += sign * tx.amount;

      // Clamp để tránh "numeric field overflow" với NUMERIC(15,2)
      const clamp = (v: number) =>
        Math.max(
          -InventoryRecalculateService.NUMERIC_MAX,
          Math.min(InventoryRecalculateService.NUMERIC_MAX, v),
        );
      state.quantity = clamp(state.quantity);
      state.value = clamp(state.value);

      if (Math.abs(state.quantity) >= 0.005) {
        state.average = clamp(state.value / state.quantity);
      }

      await manager
        .createQueryBuilder()
        .update(InventoryTransaction)
        .set({
          quantityAfter: state.quantity,
          inventoryValueAfter: state.value,
          averageCostAfter: state.average,
        })
        .where("id = :id", { id: tx.id })
        .execute();
    }
  }

  /** Giới hạn an toàn cho NUMERIC(15,2): 9,999,999,999,999.99 */
  private static readonly NUMERIC_MAX = 9999999999999.99;

  private async getLatestStateAt(
    productVariantId: string,
    storeId: string,
    occurredAt: Date,
    manager: EntityManager,
  ): Promise<{ quantity: number; value: number; average: number }> {
    const latestTx = await manager
      .createQueryBuilder(InventoryTransaction, "it")
      .where("it.productVariantId = :productVariantId", { productVariantId })
      .andWhere("it.storeId = :storeId", { storeId })
      .andWhere("it.deletedAt IS NULL")
      .andWhere("it.occurredAt <= :occurredAt", { occurredAt })
      .orderBy("it.occurredAt", "DESC")
      .addOrderBy("it.createdAt", "DESC")
      .addOrderBy("it.id", "DESC")
      .getOne();

    if (!latestTx) {
      return { quantity: 0, value: 0, average: 0 };
    }

    const quantity = latestTx.quantityAfter ?? 0;
    const value = latestTx.inventoryValueAfter ?? 0;
    const average =
      latestTx.averageCostAfter != null
        ? latestTx.averageCostAfter
        : quantity !== 0
          ? value / quantity
          : 0;

    return { quantity, value, average };
  }

  private async createWeightedTransaction(
    params: {
      occurredAt: Date;
      productVariantId: string;
      storeId: string;
      quantity: number;
      type: InventoryTransactionType;
      refType: InventoryRefTypeEnum;
      refId: string;
      refCode?: string | null;
      amount?: number;
      unitCost?: number;
      metadata?: Record<string, any> | null;
    },
    manager: EntityManager,
  ): Promise<InventoryTransaction> {
    const quantity = Math.abs(params.quantity || 0);
    const current = await this.getLatestStateAt(
      params.productVariantId,
      params.storeId,
      params.occurredAt,
      manager,
    );

    const averageBefore = current.average;

    const amount =
      params.amount !== undefined
        ? Math.abs(params.amount)
        : params.type === InventoryTransactionType.IN
          ? quantity * Math.abs(params.unitCost ?? averageBefore)
          : quantity * Math.abs(averageBefore);

    const sign = params.type === InventoryTransactionType.IN ? 1 : -1;

    let quantityAfter = current.quantity + sign * quantity;
    let inventoryValueAfter = current.value + sign * amount;

    // Clamp về phạm vi NUMERIC(15,2) an toàn để tránh "numeric field overflow"
    const clamp = (v: number) =>
      Math.max(
        -InventoryRecalculateService.NUMERIC_MAX,
        Math.min(InventoryRecalculateService.NUMERIC_MAX, v),
      );
    quantityAfter = clamp(quantityAfter);
    inventoryValueAfter = clamp(inventoryValueAfter);

    let averageCostAfter: number;
    if (Math.abs(quantityAfter) < 0.005) {
      // quantityAfter ≈ 0: giữ lại averageBefore để tránh chia cho 0 hoặc số quá nhỏ
      averageCostAfter = Math.abs(averageBefore);
    } else {
      const raw = inventoryValueAfter / quantityAfter;
      averageCostAfter = clamp(raw);
    }

    return await manager.save(InventoryTransaction, {
      occurredAt: params.occurredAt,
      productVariantId: params.productVariantId,
      storeId: params.storeId,
      quantity: quantity,
      amount,
      type: params.type,
      refType: params.refType,
      refId: params.refId,
      refCode: params.refCode || null,
      metadata: params.metadata || null,
      quantityAfter,
      inventoryValueAfter,
      averageCostAfter,
    });
  }

  private async getLatestInUnitCostAt(
    productVariantId: string,
    storeId: string,
    occurredAt: Date,
    manager: EntityManager,
  ): Promise<number> {
    const latestIn = await manager
      .createQueryBuilder(InventoryTransaction, "it")
      .where("it.productVariantId = :productVariantId", { productVariantId })
      .andWhere("it.storeId = :storeId", { storeId })
      .andWhere("it.type = :type", { type: InventoryTransactionType.IN })
      .andWhere("it.deletedAt IS NULL")
      .andWhere("it.occurredAt <= :occurredAt", { occurredAt })
      .orderBy("it.occurredAt", "DESC")
      .addOrderBy("it.createdAt", "DESC")
      .addOrderBy("it.id", "DESC")
      .getOne();

    if (!latestIn || !latestIn.quantity || latestIn.quantity <= 0) {
      return 0;
    }

    return Math.abs(latestIn.amount || 0) / Math.abs(latestIn.quantity || 1);
  }

  private async resolveAdjustmentLineCostPrice(
    line: InventoryAdjustmentLine,
    storeId: string,
    occurredAt: Date,
    manager: EntityManager,
  ): Promise<number> {
    if (line.costPriceAtTime !== undefined && line.costPriceAtTime !== null) {
      return Math.max(Number(line.costPriceAtTime) || 0, 0);
    }

    // Không có giá lịch sử thì chấp nhận tồn có giá trị = 0.
    return await this.getLatestInUnitCostAt(
      line.productVariantId,
      storeId,
      occurredAt,
      manager,
    );
  }

  private async resolveAdjustmentTransactionUnitCost(
    productVariantId: string,
    storeId: string,
    occurredAt: Date,
    fallbackCostPriceAtTime: number,
    manager: EntityManager,
  ): Promise<number> {
    const latestTx = await manager
      .createQueryBuilder(InventoryTransaction, "it")
      .where("it.productVariantId = :productVariantId", { productVariantId })
      .andWhere("it.storeId = :storeId", { storeId })
      .andWhere("it.deletedAt IS NULL")
      .andWhere("it.occurredAt <= :occurredAt", { occurredAt })
      .orderBy("it.occurredAt", "DESC")
      .addOrderBy("it.createdAt", "DESC")
      .addOrderBy("it.id", "DESC")
      .getOne();

    // Chỉ dùng average của transaction trước khi còn tồn dương.
    if (latestTx && (latestTx.quantityAfter || 0) > 0) {
      const averageFromTx = Math.abs(Number(latestTx.averageCostAfter) || 0);
      if (averageFromTx > 0) {
        return averageFromTx;
      }

      const quantityAfter = Math.abs(Number(latestTx.quantityAfter) || 0);
      const valueAfter = Math.abs(Number(latestTx.inventoryValueAfter) || 0);
      if (quantityAfter > 0 && valueAfter > 0) {
        return valueAfter / quantityAfter;
      }
    }

    // Không có average hợp lệ (transaction đầu tiên hoặc tồn trước = 0) -> fallback.
    return Math.max(Number(fallbackCostPriceAtTime) || 0, 0);
  }

  /**
   * Replay Order
   */
  private async replayOrder(
    order: Order,
    manager: EntityManager,
  ): Promise<void> {
    if (!order.lines || order.lines.length === 0) return;

    const { type, storeId, orderAt, id: orderId, code: orderCode } = order;
    const isPurchase = type === OrderTypeEnum.PURCHASE;
    const isSale = type === OrderTypeEnum.SALE;
    const isPurchaseReturn = type === OrderTypeEnum.PURCHASE_RETURN;
    const isSaleReturn = type === OrderTypeEnum.SALE_RETURN;

    // logger.info(
    //   `[REPLAY ORDER] ${orderCode} (${type}) - ${orderAt.toISOString()} - ${order.lines.length} lines`,
    // );

    for (const line of order.lines) {
      const { productVariantId, quantity } = line;
      if (!productVariantId) continue;
      const absQty = Math.abs(quantity || 0);

      if (isPurchase) {
        await this.createWeightedTransaction(
          {
            occurredAt: orderAt,
            productVariantId,
            storeId,
            quantity: absQty,
            amount: Math.abs(line.netAmount || 0),
            type: InventoryTransactionType.IN,
            refType: InventoryRefTypeEnum.PURCHASE,
            refId: orderId,
            refCode: orderCode,
          },
          manager,
        );
      } else if (isSale) {
        await this.createWeightedTransaction(
          {
            occurredAt: orderAt,
            productVariantId,
            storeId,
            quantity: absQty,
            type: InventoryTransactionType.OUT,
            refType: InventoryRefTypeEnum.SALE,
            refId: orderId,
            refCode: orderCode,
          },
          manager,
        );
      } else if (isPurchaseReturn) {
        await this.createWeightedTransaction(
          {
            occurredAt: orderAt,
            productVariantId,
            storeId,
            quantity: absQty,
            type: InventoryTransactionType.OUT,
            refType: InventoryRefTypeEnum.PURCHASE_RETURN,
            refId: orderId,
            refCode: orderCode,
            metadata: {
              refOrderLineId: line.refOrderLineId,
            },
          },
          manager,
        );
      } else if (isSaleReturn) {
        const isReturnLine = line.lineType === OrderLineTypeEnum.RETURN;

        await this.createWeightedTransaction(
          {
            occurredAt: orderAt,
            productVariantId,
            storeId,
            quantity: absQty,
            type: isReturnLine
              ? InventoryTransactionType.IN
              : InventoryTransactionType.OUT,
            refType: InventoryRefTypeEnum.SALE_RETURN,
            refId: orderId,
            refCode: orderCode,
            metadata: {
              refOrderLineId: line.refOrderLineId,
              note: isReturnLine
                ? "Nhập hàng hoàn"
                : "Xuất hàng đổi trong đơn hoàn hàng",
            },
          },
          manager,
        );
      }
    }
  }

  /**
   * Replay Order Line (cho recalculateVariantStoreFromDate)
   */
  private async replayOrderLine(
    line: OrderLine,
    manager: EntityManager,
  ): Promise<void> {
    const { productVariantId, quantity, order, netAmount } = line;
    if (!productVariantId || !order?.type) return;
    const { type, storeId, orderAt, id: orderId, code: orderCode } = order;

    const absQty = Math.abs(quantity || 0);

    if (type === OrderTypeEnum.PURCHASE) {
      await this.createWeightedTransaction(
        {
          occurredAt: orderAt,
          productVariantId,
          storeId,
          quantity: absQty,
          amount: Math.abs(netAmount || 0),
          type: InventoryTransactionType.IN,
          refType: InventoryRefTypeEnum.PURCHASE,
          refId: orderId,
          refCode: orderCode,
        },
        manager,
      );
    } else if (type === OrderTypeEnum.SALE) {
      await this.createWeightedTransaction(
        {
          occurredAt: orderAt,
          productVariantId,
          storeId,
          quantity: absQty,
          type: InventoryTransactionType.OUT,
          refType: InventoryRefTypeEnum.SALE,
          refId: orderId,
          refCode: orderCode,
        },
        manager,
      );
    } else if (type === OrderTypeEnum.PURCHASE_RETURN) {
      await this.createWeightedTransaction(
        {
          occurredAt: orderAt,
          productVariantId,
          storeId,
          quantity: absQty,
          type: InventoryTransactionType.OUT,
          refType: InventoryRefTypeEnum.PURCHASE_RETURN,
          refId: orderId,
          refCode: orderCode,
          metadata: { refOrderLineId: line.refOrderLineId },
        },
        manager,
      );
    } else if (type === OrderTypeEnum.SALE_RETURN) {
      const isReturnLine = line.lineType === OrderLineTypeEnum.RETURN;
      await this.createWeightedTransaction(
        {
          occurredAt: orderAt,
          productVariantId,
          storeId,
          quantity: absQty,
          type: isReturnLine
            ? InventoryTransactionType.IN
            : InventoryTransactionType.OUT,
          refType: InventoryRefTypeEnum.SALE_RETURN,
          refId: orderId,
          refCode: orderCode,
          metadata: {
            refOrderLineId: line.refOrderLineId,
            note: isReturnLine
              ? "Nhập hàng hoàn"
              : "Xuất hàng đổi trong đơn hoàn hàng",
          },
        },
        manager,
      );
    }
  }

  /**
   * Replay Store Transfer
   * QUAN TRỌNG:
   * 1. Xuất từ kho A theo FIFO → Được LIST các lô [(30, giá a), (20, giá b)]
   * 2. Nhập vào kho B → Tạo CHÍNH XÁC từng lô riêng biệt với đúng giá vốn
   * 3. Đảm bảo kho B có đúng stockTracking như kho A (giữ nguyên FIFO detail)
   */
  private async replayTransfer(
    transfer: StoreTransfer,
    manager: EntityManager,
  ): Promise<void> {
    if (!transfer.lines || transfer.lines.length === 0) return;

    // logger.info(
    //   `[REPLAY TRANSFER] ${transfer.code} - ${transfer.occurredAt.toISOString()}`,
    // );
    // logger.info(
    //   `  From store: ${transfer.fromStoreId.substring(0, 8)}... → To store: ${transfer.toStoreId.substring(0, 8)}...`,
    // );

    for (const line of transfer.lines) {
      const { quantity, productVariantId } = line;
      const outTx = await this.createWeightedTransaction(
        {
          occurredAt: transfer.occurredAt,
          productVariantId,
          storeId: transfer.fromStoreId,
          quantity,
          type: InventoryTransactionType.OUT,
          refType: InventoryRefTypeEnum.TRANSFER,
          refId: transfer.id,
          refCode: transfer.code,
        },
        manager,
      );

      await this.createWeightedTransaction(
        {
          occurredAt: transfer.occurredAt,
          productVariantId,
          storeId: transfer.toStoreId,
          quantity,
          amount: outTx.amount,
          type: InventoryTransactionType.IN,
          refType: InventoryRefTypeEnum.TRANSFER,
          refId: transfer.id,
          refCode: transfer.code,
        },
        manager,
      );
    }
  }

  /**
   * Replay Store Transfer Line (cho recalculateVariantStoreFromDate)
   * ⚠️ QUAN TRỌNG: CHỈ ghi transaction cho store đang được recalculate (this.currentStoreId)
   * - Nếu là fromStore: Ghi transaction OUT + giảm stockTracking
   * - Nếu là toStore: Lấy FIFO details từ OUT transaction → Ghi IN + tạo stockTracking
   */
  private async replayTransferLine(
    line: StoreTransferLine,
    manager: EntityManager,
  ): Promise<void> {
    const { quantity, productVariantId, transfer } = line;
    if (!productVariantId || !transfer) return;
    const {
      fromStoreId,
      toStoreId,
      occurredAt,
      id: transferId,
      code: transferCode,
    } = transfer;

    // ========== XỬ LÝ XUẤT TỪ KHO NGUỒN (fromStore) ==========
    if (this.currentStoreId === fromStoreId) {
      await this.createWeightedTransaction(
        {
          occurredAt,
          productVariantId,
          storeId: fromStoreId,
          quantity,
          type: InventoryTransactionType.OUT,
          refType: InventoryRefTypeEnum.TRANSFER,
          refId: transferId,
          refCode: transferCode,
        },
        manager,
      );
    }
    // ========== XỬ LÝ NHẬP VÀO KHO ĐÍCH (toStore) ==========
    else if (this.currentStoreId === toStoreId) {
      // ⚠️ Phải lấy transaction OUT của fromStore
      // → Đảm bảo toStore nhận đúng giá vốn từ fromStore
      const outTx = await manager.findOne(InventoryTransaction, {
        where: {
          refType: InventoryRefTypeEnum.TRANSFER,
          refId: transferId,
          productVariantId,
          storeId: fromStoreId,
          type: InventoryTransactionType.OUT,
          deletedAt: null as any,
        },
      });

      if (!outTx) {
        throw new Error(
          `[RECALCULATE] ⚠️ Chưa recalculate store ${fromStoreId.substring(0, 8)}... (fromStore). ` +
            `Phải recalculate fromStore TRƯỚC toStore cho transfer ${transferCode}!`,
        );
      }

      const totalAmount = outTx.amount;

      await this.createWeightedTransaction(
        {
          occurredAt,
          productVariantId,
          storeId: toStoreId,
          quantity,
          amount: totalAmount,
          type: InventoryTransactionType.IN,
          refType: InventoryRefTypeEnum.TRANSFER,
          refId: transferId,
          refCode: transferCode,
        },
        manager,
      );
    }
  }

  /**
   * Replay Inventory Adjustment
   */
  private async replayAdjustment(
    adjustment: InventoryAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    if (!adjustment.lines || adjustment.lines.length === 0) return;

    // logger.info(
    //   `[REPLAY ADJUSTMENT] ${adjustment.code} - ${adjustment.occurredAt.toISOString()}`,
    // );

    const newLineData: DeepPartial<InventoryAdjustmentLine>[] = [];

    for (const line of adjustment.lines) {
      const costPriceAtTime = await this.resolveAdjustmentLineCostPrice(
        line,
        adjustment.storeId,
        adjustment.occurredAt,
        manager,
      );
      const txUnitCost = await this.resolveAdjustmentTransactionUnitCost(
        line.productVariantId,
        adjustment.storeId,
        adjustment.occurredAt,
        costPriceAtTime,
        manager,
      );

      // Phải tính lại countedQty cho adjustment line
      const countedQty = await this.getVariantStockAtDate(
        line.productVariantId,
        adjustment.storeId,
        adjustment.occurredAt,
        manager,
      );

      const deltaQty = Math.abs(line.expectedQty - countedQty);
      const direction =
        line.expectedQty > countedQty
          ? InventoryTransactionType.IN
          : InventoryTransactionType.OUT;

      // logger.info(
      //   `  Variant ${line.productVariantId.substring(0, 8)}... ` +
      //     `expected=${line.expectedQty}, counted=${countedQty}, delta=${deltaQty} (${direction})`,
      // );

      if (deltaQty === 0) {
        newLineData.push({
          ...line,
          countedQty,
          deltaQty: 0,
          direction,
          costPriceAtTime,
          adjustmentValue: 0,
        });
        continue;
      }

      if (direction === InventoryTransactionType.IN) {
        const tx = await this.createWeightedTransaction(
          {
            occurredAt: adjustment.occurredAt,
            productVariantId: line.productVariantId,
            storeId: adjustment.storeId,
            quantity: deltaQty,
            amount: deltaQty * txUnitCost,
            type: InventoryTransactionType.IN,
            refType: InventoryRefTypeEnum.ADJUST,
            refId: adjustment.id,
            refCode: adjustment.code,
          },
          manager,
        );

        newLineData.push({
          ...line,
          countedQty,
          deltaQty,
          direction,
          costPriceAtTime,
          adjustmentValue: tx.amount,
        });
      } else {
        const tx = await this.createWeightedTransaction(
          {
            occurredAt: adjustment.occurredAt,
            productVariantId: line.productVariantId,
            storeId: adjustment.storeId,
            quantity: deltaQty,
            amount: deltaQty * txUnitCost,
            type: InventoryTransactionType.OUT,
            refType: InventoryRefTypeEnum.ADJUST,
            refId: adjustment.id,
            refCode: adjustment.code,
          },
          manager,
        );

        newLineData.push({
          ...line,
          countedQty,
          deltaQty,
          direction,
          costPriceAtTime,
          adjustmentValue: tx.amount,
        });
      }
    }

    // Cập nhật lại line với countedQty, deltaQty, direction mới tính
    await manager.save(InventoryAdjustmentLine, newLineData);

    // Tính lại totalAdjustmentQty và totalAdjustmentValue từ lines
    let totalAdjustmentQty = 0;
    let totalAdjustmentValue = 0;

    for (const line of newLineData) {
      if (line.deltaQty === 0) continue;

      const multiplier =
        line.direction === InventoryTransactionType.IN ? 1 : -1;
      totalAdjustmentQty += line.deltaQty! * multiplier;
      totalAdjustmentValue +=
        // line.deltaQty! * (line.costPriceAtTime || 0) * multiplier;
        (line.adjustmentValue || 0) * multiplier;
    }

    // Cập nhật tổng vào adjustment
    await manager.update(
      InventoryAdjustment,
      { id: adjustment.id },
      {
        totalAdjustmentQty,
        totalAdjustmentValue,
      },
    );

    // logger.info(
    //   `  [ADJUSTMENT TOTALS] quantity=${totalAdjustmentQty.toFixed(2)}, value=${totalAdjustmentValue.toFixed(2)}`,
    // );
  }

  /**
   * Replay Inventory Adjustment Line (cho recalculateVariantStoreFromDate)
   */
  private async replayAdjustmentLine(
    line: InventoryAdjustmentLine,
    manager: EntityManager,
  ): Promise<void> {
    const { productVariantId, expectedQty, adjustment } = line;
    if (!productVariantId || !adjustment) return;

    const {
      storeId,
      occurredAt,
      id: adjustmentId,
      code: adjustmentCode,
    } = adjustment;

    const costPriceAtTime = await this.resolveAdjustmentLineCostPrice(
      line,
      storeId,
      occurredAt,
      manager,
    );
    const txUnitCost = await this.resolveAdjustmentTransactionUnitCost(
      productVariantId,
      storeId,
      occurredAt,
      costPriceAtTime,
      manager,
    );

    // Phải tính lại countedQty cho adjustment line
    const countedQty = await this.getVariantStockAtDate(
      productVariantId,
      storeId,
      occurredAt,
      manager,
    );
    const deltaQty = Math.abs(expectedQty - countedQty);
    const direction =
      expectedQty > countedQty
        ? InventoryTransactionType.IN
        : InventoryTransactionType.OUT;

    if (deltaQty === 0) {
      await manager.save(InventoryAdjustmentLine, {
        ...line,
        countedQty,
        deltaQty: 0,
        direction,
        costPriceAtTime,
        adjustmentValue: 0,
      });
      return;
    }

    if (direction === InventoryTransactionType.IN) {
      const tx = await this.createWeightedTransaction(
        {
          occurredAt,
          productVariantId,
          storeId,
          quantity: deltaQty,
          amount: deltaQty * txUnitCost,
          type: InventoryTransactionType.IN,
          refType: InventoryRefTypeEnum.ADJUST,
          refId: adjustmentId,
          refCode: adjustmentCode,
        },
        manager,
      );
      await manager.save(InventoryAdjustmentLine, {
        ...line,
        countedQty,
        deltaQty,
        direction,
        costPriceAtTime,
        adjustmentValue: tx.amount,
      });
    } else {
      const tx = await this.createWeightedTransaction(
        {
          occurredAt,
          productVariantId,
          storeId,
          quantity: deltaQty,
          amount: deltaQty * txUnitCost,
          type: InventoryTransactionType.OUT,
          refType: InventoryRefTypeEnum.ADJUST,
          refId: adjustmentId,
          refCode: adjustmentCode,
        },
        manager,
      );
      await manager.save(InventoryAdjustmentLine, {
        ...line,
        countedQty,
        deltaQty,
        direction,
        costPriceAtTime,
        adjustmentValue: tx.amount,
      });
    }

    // Sau khi replay line, cần tính lại tổng cho adjustment
    const lines = await manager.find(InventoryAdjustmentLine, {
      where: { adjustmentId },
    });
    let totalAdjustmentQty = 0;
    let totalAdjustmentValue = 0;
    for (const l of lines) {
      if (l.deltaQty === 0) continue;
      const multiplier = l.direction === InventoryTransactionType.IN ? 1 : -1;
      totalAdjustmentQty += l.deltaQty! * multiplier;
      totalAdjustmentValue += (l.adjustmentValue || 0) * multiplier;
    }
    await manager.update(
      InventoryAdjustment,
      { id: adjustmentId },
      {
        totalAdjustmentQty,
        totalAdjustmentValue,
      },
    );
  }

  /**
   * Validate tính toàn vẹn dữ liệu sau khi recalculate
   */
  async validateAfterRecalculate(manager: EntityManager): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Kiểm tra quantityAfter âm (tồn kho âm) trên inventory_transactions
    const negativeQty = await manager
      .createQueryBuilder(InventoryTransaction, "it")
      .select("it.productVariantId", "productVariantId")
      .addSelect("it.storeId", "storeId")
      .addSelect("MIN(it.quantityAfter)", "minQty")
      .groupBy("it.productVariantId")
      .addGroupBy("it.storeId")
      .having("MIN(it.quantityAfter) < 0")
      .getRawMany();

    negativeQty.forEach((row) => {
      errors.push(
        `Variant ${row.productVariantId.substring(0, 8)}... tại store ${row.storeId.substring(0, 8)}... ` +
          `có quantityAfter tối thiểu = ${parseFloat(row.minQty).toFixed(2)} (ÂM!)`,
      );
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Lấy tồn kho hiện tại của một productVariant tại một store
   * Dùng để validate trước khi cho phép tăng số lượng xuất kho
   * @param productVariantId
   * @param storeId
   * @param manager
   * @returns
   */
  async getCurrentStockAtStore(
    productVariantId: string,
    storeId: string,
    manager: EntityManager,
  ): Promise<number> {
    const result = await manager
      .createQueryBuilder(InventoryTransaction, "it")
      .select(
        "COALESCE(SUM(CASE WHEN it.type = 'in' THEN it.quantity ELSE -it.quantity END), 0)",
        "total",
      )
      .where("it.productVariantId = :productVariantId", { productVariantId })
      .andWhere("it.storeId = :storeId", { storeId })
      .andWhere("it.deletedAt IS NULL")
      .getRawOne();

    return parseFloat(result?.total || "0");
  }

  async getVariantStockAtDate(
    variantId: string,
    storeId: string,
    atDate: Date,
    manager: EntityManager,
  ): Promise<number> {
    const result = await manager
      .createQueryBuilder(InventoryTransaction, "it")
      .select(
        "COALESCE(SUM(CASE WHEN it.type = 'in' THEN it.quantity ELSE -it.quantity END), 0)",
        "total",
      )
      .where("it.productVariantId = :variantId", { variantId })
      .andWhere("it.storeId = :storeId", { storeId })
      .andWhere("it.deletedAt IS NULL")
      .andWhere("it.occurredAt <= :atDate", { atDate })
      .getRawOne();

    return parseFloat(result?.total || "0");
  }

  /**
   * Tính giá vốn trung bình gia quyền (Weighted Average Cost)
   * Dùng để preview cho user trước khi điều chỉnh giảm
   * @param variantId
   * @param storeId
   * @param manager
   * @returns Giá vốn trung bình
   */
  async getWeightedAverageCost(
    variantId: string,
    storeId: string,
    manager: EntityManager,
  ): Promise<number> {
    const latestTx = await manager
      .createQueryBuilder(InventoryTransaction, "it")
      .where("it.productVariantId = :variantId", { variantId })
      .andWhere("it.storeId = :storeId", { storeId })
      .andWhere("it.deletedAt IS NULL")
      .orderBy("it.occurredAt", "DESC")
      .addOrderBy("it.createdAt", "DESC")
      .addOrderBy("it.id", "DESC")
      .getOne();

    if (!latestTx) {
      return 0;
    }

    return latestTx.averageCostAfter || 0;
  }

  /**
   * Preview giá vốn FIFO cho điều chỉnh giảm
   * Không thực sự giảm stock, chỉ tính toán để hiển thị
   * @param variantId
   * @param storeId
   * @param quantity Số lượng dự định giảm
   * @param manager
   * @returns Giá vốn FIFO ước tính
   */
  async previewFifoCostForAdjustment(
    variantId: string,
    storeId: string,
    quantity: number,
    manager: EntityManager,
  ): Promise<{
    estimatedCost: number;
    averageUnitCost: number;
    fifoDetails: Array<{ quantity: number; unitCost: number }>;
  }> {
    const averageUnitCost = await this.getWeightedAverageCost(
      variantId,
      storeId,
      manager,
    );
    const estimatedCost = averageUnitCost * quantity;

    return {
      estimatedCost,
      averageUnitCost,
      fifoDetails: [{ quantity, unitCost: averageUnitCost }],
    };
  }

  /**
   * Helper: Lấy danh sách stores bị ảnh hưởng từ một variant + store
   * Dùng để detect stores nào cần recalculate khi có transfer
   * @returns Array [storeId, fromDate] đã sort theo thứ tự thời gian (sớm nhất trước)
   */
  async getAffectedStores(
    variantId: string,
    storeId: string,
    fromDate: Date,
    manager: EntityManager,
  ): Promise<Array<[string, Date]>> {
    const affectedStoresMap = new Map<string, Date>();
    affectedStoresMap.set(storeId, fromDate);

    // Lấy tất cả transferLines liên quan đến variant + store từ fromDate
    const transferLines = await manager
      .createQueryBuilder(StoreTransferLine, "stl")
      .leftJoinAndSelect("stl.transfer", "t")
      .where("t.occurredAt >= :fromDate", { fromDate })
      .andWhere("stl.productVariantId = :variantId", { variantId })
      .andWhere(
        new Brackets((qb) => {
          qb.where("t.fromStoreId = :storeId", { storeId }).orWhere(
            "t.toStoreId = :storeId",
            { storeId },
          );
        }),
      )
      .andWhere("stl.deletedAt IS NULL")
      .orderBy("t.occurredAt", "ASC")
      .getMany();

    // Duyệt qua từng transfer để thêm stores bị ảnh hưởng
    for (const line of transferLines) {
      const { fromStoreId, toStoreId, occurredAt: transferAt } = line.transfer;

      // Nếu đã có fromStore trong map → toStore cũng bị ảnh hưởng
      if (
        affectedStoresMap.has(fromStoreId) &&
        !affectedStoresMap.has(toStoreId)
      ) {
        affectedStoresMap.set(toStoreId, transferAt);
      }
      // Nếu đã có toStore trong map → fromStore cũng bị ảnh hưởng (trường hợp ngược)
      if (
        affectedStoresMap.has(toStoreId) &&
        !affectedStoresMap.has(fromStoreId)
      ) {
        affectedStoresMap.set(fromStoreId, transferAt);
      }
    }

    // Sort theo thứ tự thời gian (stores bị ảnh hưởng sớm nhất recalculate trước)
    const sortedStores = Array.from(affectedStoresMap.entries()).sort(
      (a, b) => a[1].getTime() - b[1].getTime(),
    );

    return sortedStores;
  }
}
