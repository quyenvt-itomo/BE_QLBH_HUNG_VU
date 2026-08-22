import { inject, injectable } from "inversify";
import { EntityManager, In, IsNull, Not } from "typeorm";
import { TransactionService } from "@/shared/base/TransactionService";
import { INVENTORY_TYPES } from "./inventory.types";
import { StockMetadataHelper } from "./stockMetadata.helper";
import logger from "@/shared/utils/logger";
import {
  InventoryTransaction,
  InventoryTransactionRefType,
  FifoData,
} from "@/database/models/company/InventoryTransaction";
import { TransactionTypeEnum } from "@/shared/constants/enum";
import { StockDocumentStatus } from "@/database/models/company/StockDocument";
import { WarehouseTransfer } from "@/database/models/company/WarehouseTransfer";
import { WarehouseTransferLine } from "@/database/models/company/WarehouseTransferLine";

// =====================================================================
// Interfaces
// =====================================================================
export interface InventoryTransactionParams {
  productId: string;
  warehouseId: string;
  quantity: number;
  type: TransactionTypeEnum;
  refType: InventoryTransactionRefType;
  refId: string;
  refCode: string;
  occurredAt: Date;
  amount?: number;
  unitCost?: number;
  /** Chênh lệch giá base dùng cho transaction quantity = 0. */
  priceDifference?: number;
  companyId: string;
}

export interface InventoryState {
  quantity: number;
  value: number;
}

/**
 * Node cần tính lại tồn kho (product, warehouse)
 */
export interface InventoryRecalculateNode {
  productId: string;
  warehouseId: string;
  fromDate: Date | string;
}

/**
 * Inventory Recalculate Service
 *
 * Xử lý tính toán tồn kho theo phương pháp FIFO (nhập trước xuất trước).
 *
 * Nguyên tắc:
 * - Mỗi InventoryTransaction lưu trạng thái running (quantityAfter, inventoryValueAfter, fifoDataAfter)
 * - Khi nhập kho: amount = quantity * unitCost (hoặc giữ nguyên amount nếu có)
 * - Khi xuất kho: amount được tính bằng cách tiêu thụ dần từ các lô FIFO cũ nhất
 * - Production nhập thành phẩm: KHÔNG tính giá vốn (amount = 0), chỉ ghi nhận số lượng
 * - Có thể rebuild từ một thời điểm bất kỳ khi sửa phiếu cũ
 */
@injectable()
export class InventoryRecalculateService extends TransactionService {
  constructor(
    @inject(INVENTORY_TYPES.StockMetadataHelper)
    private stockMetadataHelper: StockMetadataHelper,
  ) {
    super();
  }

  // =====================================================================
  // CORE: Tạo 1 transaction với FIFO
  // =====================================================================

  /**
   * Tạo transaction với logic FIFO (nhập trước xuất trước).
   * Tự động tính fifoDataAfter, quantityAfter, inventoryValueAfter.
   */
  async createFifoTransaction(
    params: InventoryTransactionParams,
    manager: EntityManager,
  ): Promise<InventoryTransaction> {
    const repo = manager.getRepository(InventoryTransaction);
    const {
      type,
      productId,
      warehouseId,
      occurredAt,
      quantity,
      unitCost,
      amount: paramAmount,
      refType,
      refId,
      refCode,
      companyId,
      priceDifference,
    } = params;

    // 1. Lấy transaction gần nhất trước thời điểm này
    const prevTx = await repo
      .createQueryBuilder("it")
      .where('it."productId" = :productId', { productId })
      .andWhere('it."warehouseId" = :warehouseId', {
        warehouseId,
      })
      .andWhere('it."occurredAt" <= :before', { before: occurredAt })
      .andWhere('it."deletedAt" IS NULL')
      .orderBy('it."occurredAt"', "DESC")
      .addOrderBy('it."createdAt"', "DESC")
      .limit(1)
      .getOne();

    const prevFifo: FifoData[] = prevTx?.fifoDataAfter
      ? [...prevTx.fifoDataAfter]
      : [];
    const prevQty = prevTx ? Number(prevTx.quantityAfter) || 0 : 0;
    const prevValue = prevTx ? Number(prevTx.inventoryValueAfter) || 0 : 0;

    const qty = Math.abs(quantity);
    let amount: number;
    let newFifo: FifoData[];

    let inventoryValueAfter: number = prevValue;

    if (qty === 0 && priceDifference) {
      // Đổi giá vốn toàn bộ tồn hiện tại nhưng không đổi số lượng.
      // Với tồn âm, delta vẫn giữ dấu theo quantity * priceDifference.
      const valueDelta = prevQty * priceDifference;
      amount = Math.abs(valueDelta);
      newFifo = prevFifo.map((entry) => ({
        ...entry,
        unitPrice: entry.unitPrice + priceDifference,
      }));
      inventoryValueAfter = prevValue + valueDelta;
    } else if (type === TransactionTypeEnum.IN) {
      // Nhập kho: thêm vào cuối FIFO queue
      const unitPrice =
        unitCost ??
        (paramAmount !== undefined ? Math.abs(paramAmount) / qty : 0);
      amount = qty * unitPrice;

      newFifo = [
        ...prevFifo,
        {
          quantity: qty,
          unitPrice,
          occurredAt: occurredAt,
          refId: refId,
          refCode: refCode,
          refType: refType,
        },
      ];
    } else {
      // Xuất kho: tiêu thụ từ đầu FIFO queue
      let remaining = qty;
      amount = 0;
      const consumed: FifoData[] = [];

      for (const entry of prevFifo) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, entry.quantity);
        amount += take * entry.unitPrice;
        remaining -= take;

        if (entry.quantity - take > 0.0001) {
          consumed.push({ ...entry, quantity: entry.quantity - take });
        }
      }

      newFifo = consumed;
    }

    const sign = type === TransactionTypeEnum.IN ? 1 : -1;
    const quantityAfter = prevQty + sign * qty;
    if (inventoryValueAfter === undefined) {
      inventoryValueAfter = prevValue + sign * amount;
    }

    const tx = repo.create({
      companyId: companyId,
      productId: productId,
      warehouseId: warehouseId,
      quantity: qty,
      amount,
      type: type,
      refType: refType,
      refId: refId,
      refCode: refCode,
      occurredAt: occurredAt,
      quantityAfter,
      inventoryValueAfter,
      fifoDataAfter: newFifo,
    });

    return repo.save(tx);
  }

  /**
   * Lấy trạng thái tồn kho mới nhất trước thời điểm `before`
   */
  async getLatestStateAt(
    productId: string,
    warehouseId: string,
    before: Date,
    manager: EntityManager,
  ): Promise<InventoryState> {
    const tx = await manager
      .getRepository(InventoryTransaction)
      .createQueryBuilder("it")
      .where('it."productId" = :productId', { productId })
      .andWhere('it."warehouseId" = :warehouseId', { warehouseId })
      .andWhere('it."occurredAt" <= :before', { before })
      .andWhere('it."deletedAt" IS NULL')
      .orderBy('it."occurredAt"', "DESC")
      .addOrderBy('it."createdAt"', "DESC")
      .limit(1)
      .getOne();

    if (tx) {
      return {
        quantity: Number(tx.quantityAfter) || 0,
        value: Number(tx.inventoryValueAfter) || 0,
      };
    }

    return { quantity: 0, value: 0 };
  }

  // =====================================================================
  // RECALCULATE: Xóa và rebuild transaction từ 1 thời điểm
  // =====================================================================

  /**
   * Recalculate toàn bộ inventory cho 1 (productId, warehouseId) từ fromDate
   *
   * Quy trình:
   * 1. Xóa tất cả transaction có occurredAt >= fromDate
   * 2. Lấy tất cả document có occurredAt >= fromDate
   * 3. Sắp xếp theo thời gian
   * 4. Rebuild từng transaction
   * 5. Cập nhật stockMetadata
   */
  async recalculateProductWarehouseFromDate(
    productId: string,
    warehouseId: string,
    fromDate: Date,
    manager: EntityManager,
  ): Promise<void> {
    const txRepo = manager.getRepository(InventoryTransaction);

    // 1. Xóa transaction cũ từ fromDate
    await txRepo
      .createQueryBuilder()
      .softDelete()
      .where('"productId" = :productId', { productId })
      .andWhere('"warehouseId" = :warehouseId', { warehouseId })
      .andWhere('"occurredAt" >= :fromDate', { fromDate })
      .execute();

    // 2. Lấy tất cả document để rebuild
    const items = await this.collectDocumentsForRebuild(
      productId,
      warehouseId,
      fromDate,
      manager,
    );

    // 3. Rebuild từng document theo thứ tự thời gian
    for (const item of items) {
      await this.recalcWithSavepoint(
        manager,
        `rebuild_${item.refId.substring(0, 8)}`,
        async () => {
          await this.rebuildDocument(item, manager);
        },
      );
    }

    // 4. Cập nhật stockMetadata
    await this.stockMetadataHelper.updateStockMetadataForPair(
      productId,
      warehouseId,
      manager,
    );
  }

  /**
   * Collect tất cả document có ảnh hưởng đến inventory từ fromDate
   */
  private async collectDocumentsForRebuild(
    productId: string,
    warehouseId: string,
    fromDate: Date,
    manager: EntityManager,
  ): Promise<
    Array<{
      type: string;
      refType: InventoryTransactionRefType;
      refId: string;
      refCode: string;
      occurredAt: Date;
      productId: string;
      warehouseId: string;
      quantity: number;
      amount: number;
      unitCost: number;
      priceDifference?: number;
      sortOrder?: number;
      txType: TransactionTypeEnum;
      companyId: string;
    }>
  > {
    const items: Array<{
      type: string;
      refType: InventoryTransactionRefType;
      refId: string;
      refCode: string;
      occurredAt: Date;
      productId: string;
      warehouseId: string;
      quantity: number;
      amount: number;
      unitCost: number;
      priceDifference?: number;
      sortOrder?: number;
      txType: TransactionTypeEnum;
      companyId: string;
    }> = [];

    // --- StockDocument IN (PURCHASE_RECEIPT, PRODUCTION_RECEIPT) ---
    const stockDocsIn = await manager
      .createQueryBuilder()
      .select("sd.id", "refId")
      .addSelect("sd.code", "refCode")
      .addSelect('sd."actualImportDate"', "occurredAt")
      .addSelect('sd."companyId"', "companyId")
      .addSelect("sd.type", "docType")
      .from("stock_documents", "sd")
      .innerJoin("stock_document_lines", "sdl", 'sdl."stockDocumentId" = sd.id')
      .where("sd.status = :status", { status: StockDocumentStatus.COMPLETED })
      .andWhere('sd."actualImportDate" >= :fromDate', { fromDate })
      .andWhere('sd."warehouseId" = :warehouseId', { warehouseId })
      .andWhere('sdl."productId" = :productId', { productId })
      .andWhere('sd."deletedAt" IS NULL')
      .getRawMany();

    for (const doc of stockDocsIn) {
      const isProduction = doc.docType === "PRODUCTION_RECEIPT";
      const lines = await manager
        .createQueryBuilder()
        .select(
          'COALESCE(sdl."stockQuantity", 0) * COALESCE(sdl."conversionRateAtTime", 1)',
          "quantity",
        )
        .addSelect(
          isProduction
            ? "0"
            : 'COALESCE(pl."unitPrice", 0) / NULLIF(COALESCE(sdl."conversionRateAtTime", 1), 0)',
          "unitCost",
        )
        .addSelect(
          isProduction
            ? "0"
            : '(COALESCE(sdl."stockQuantity", 0) * COALESCE(sdl."conversionRateAtTime", 1)) * (COALESCE(pl."unitPrice", 0) / NULLIF(COALESCE(sdl."conversionRateAtTime", 1), 0))',
          "amount",
        )
        .from("stock_document_lines", "sdl")
        .leftJoin(
          "purchase_lines",
          "pl",
          'pl.id = sdl."purchaseLineId" AND pl."deletedAt" IS NULL',
        )
        .where('sdl."stockDocumentId" = :refId', { refId: doc.refId })
        .andWhere('sdl."productId" = :productId', { productId })
        .getRawMany();

      for (const line of lines) {
        const qty = parseFloat(line.quantity) || 0;
        const unitCost = parseFloat(line.unitCost) || 0;
        const amount = parseFloat(line.amount) || 0;

        items.push({
          type: "STOCK_DOCUMENT",
          refType: isProduction
            ? InventoryTransactionRefType.PRODUCTION_RECEIPT
            : InventoryTransactionRefType.PURCHASE_RECEIPT,
          refId: doc.refId,
          refCode: doc.refCode,
          occurredAt: new Date(doc.occurredAt),
          productId,
          warehouseId,
          quantity: qty,
          amount,
          unitCost,
          txType: TransactionTypeEnum.IN,
          companyId: doc.companyId,
        });
      }
    }

    // --- StockDocument OUT (ORDER_ISSUE, MATERIAL_ISSUE) ---
    const stockDocsOut = await manager
      .createQueryBuilder()
      .select("sd.id", "refId")
      .addSelect("sd.code", "refCode")
      .addSelect('sd."actualExportDate"', "occurredAt")
      .addSelect('sd."companyId"', "companyId")
      .addSelect("sd.type", "docType")
      .from("stock_documents", "sd")
      .innerJoin("stock_document_lines", "sdl", 'sdl."stockDocumentId" = sd.id')
      .where("sd.status IN (:...statuses)", {
        statuses: [StockDocumentStatus.EXPORTED, StockDocumentStatus.COMPLETED],
      })
      .andWhere('sd."actualExportDate" >= :fromDate', { fromDate })
      .andWhere('sd."warehouseId" = :warehouseId', { warehouseId })
      .andWhere('sdl."productId" = :productId', { productId })
      .andWhere('sd."deletedAt" IS NULL')
      .getRawMany();

    for (const doc of stockDocsOut) {
      const lines = await manager
        .createQueryBuilder()
        .select(
          'COALESCE(sdl."stockQuantity", 0) * COALESCE(sdl."conversionRateAtTime", 1)',
          "quantity",
        )
        .from("stock_document_lines", "sdl")
        .where('sdl."stockDocumentId" = :refId', { refId: doc.refId })
        .andWhere('sdl."productId" = :productId', { productId })
        .getRawMany();

      for (const line of lines) {
        const qty = parseFloat(line.quantity) || 0;
        items.push({
          type: "STOCK_DOCUMENT",
          refType:
            doc.docType === "ORDER_ISSUE"
              ? InventoryTransactionRefType.ORDER_ISSUE
              : InventoryTransactionRefType.MATERIAL_ISSUE,
          refId: doc.refId,
          refCode: doc.refCode,
          occurredAt: new Date(doc.occurredAt),
          productId,
          warehouseId,
          quantity: qty,
          amount: 0, // Will be calculated by FIFO
          unitCost: 0,
          txType: TransactionTypeEnum.OUT,
          companyId: doc.companyId,
        });
      }
    }

    // --- WarehouseTransfer IN ---
    const transfersIn = await manager
      .createQueryBuilder()
      .select("wt.id", "refId")
      .addSelect("wt.code", "refCode")
      .addSelect('wt."importedAt"', "occurredAt")
      .addSelect('wt."companyId"', "companyId")
      .from("warehouse_transfers", "wt")
      .innerJoin("warehouse_transfer_lines", "wtl", 'wtl."transferId" = wt.id')
      .where('wt."importedAt" IS NOT NULL')
      .andWhere('wt."importedAt" >= :fromDate', { fromDate })
      .andWhere('wt."toWarehouseId" = :warehouseId', { warehouseId })
      .andWhere('wtl."productId" = :productId', { productId })
      .andWhere('wt."deletedAt" IS NULL')
      .getRawMany();

    for (const doc of transfersIn) {
      const lines = await manager
        .createQueryBuilder()
        .select(
          'COALESCE(wtl."receivedQuantity", 0) * COALESCE(wtl."conversionRateAtTime", 1)',
          "quantity",
        )
        .from("warehouse_transfer_lines", "wtl")
        .where('wtl."transferId" = :refId', { refId: doc.refId })
        .andWhere('wtl."productId" = :productId', { productId })
        .getRawMany();

      for (const line of lines) {
        const qty = parseFloat(line.quantity) || 0;
        items.push({
          type: "WAREHOUSE_TRANSFER",
          refType: InventoryTransactionRefType.TRANSFER,
          refId: doc.refId,
          refCode: doc.refCode,
          occurredAt: new Date(doc.occurredAt),
          productId,
          warehouseId,
          quantity: qty,
          amount: 0, // Will be calculated by FIFO
          unitCost: 0,
          txType: TransactionTypeEnum.IN,
          companyId: doc.companyId,
        });
      }
    }

    // --- WarehouseTransfer OUT ---
    const transfersOut = await manager
      .createQueryBuilder()
      .select("wt.id", "refId")
      .addSelect("wt.code", "refCode")
      .addSelect('wt."exportedAt"', "occurredAt")
      .addSelect('wt."companyId"', "companyId")
      .from("warehouse_transfers", "wt")
      .innerJoin("warehouse_transfer_lines", "wtl", 'wtl."transferId" = wt.id')
      .where('wt."exportedAt" IS NOT NULL')
      .andWhere('wt."exportedAt" >= :fromDate', { fromDate })
      .andWhere('wt."fromWarehouseId" = :warehouseId', { warehouseId })
      .andWhere('wtl."productId" = :productId', { productId })
      .andWhere('wt."deletedAt" IS NULL')
      .getRawMany();

    for (const doc of transfersOut) {
      const lines = await manager
        .createQueryBuilder()
        .select(
          'COALESCE(wtl."actualQuantity", 0) * COALESCE(wtl."conversionRateAtTime", 1)',
          "quantity",
        )
        .from("warehouse_transfer_lines", "wtl")
        .where('wtl."transferId" = :refId', { refId: doc.refId })
        .andWhere('wtl."productId" = :productId', { productId })
        .getRawMany();

      for (const line of lines) {
        const qty = parseFloat(line.quantity) || 0;
        items.push({
          type: "WAREHOUSE_TRANSFER",
          refType: InventoryTransactionRefType.TRANSFER,
          refId: doc.refId,
          refCode: doc.refCode,
          occurredAt: new Date(doc.occurredAt),
          productId,
          warehouseId,
          quantity: qty,
          amount: 0,
          unitCost: 0,
          txType: TransactionTypeEnum.OUT,
          companyId: doc.companyId,
        });
      }
    }

    // --- InventoryAdjustment ---
    const adjustments = await manager
      .createQueryBuilder()
      .select("ia.id", "refId")
      .addSelect("ia.code", "refCode")
      .addSelect('ia."occurredAt"', "occurredAt")
      .addSelect('ia."companyId"', "companyId")
      .from("inventory_adjustments", "ia")
      .innerJoin(
        "inventory_adjustment_lines",
        "ial",
        'ial."adjustmentId" = ia.id',
      )
      .andWhere('ia."occurredAt" >= :fromDate', { fromDate })
      .andWhere('ia."warehouseId" = :warehouseId', { warehouseId })
      .andWhere('ial."productId" = :productId', { productId })
      .andWhere('ia."deletedAt" IS NULL')
      .getRawMany();

    for (const doc of adjustments) {
      const lines = await manager
        .createQueryBuilder()
        .select('ial."deltaQuantity"', "quantity")
        .addSelect('ial."adjustmentValue"', "amount")
        .addSelect('ial."costPriceAtTime"', "unitCost")
        .addSelect('ial."type"', "type")
        .from("inventory_adjustment_lines", "ial")
        .where('ial."adjustmentId" = :refId', { refId: doc.refId })
        .andWhere('ial."productId" = :productId', { productId })
        .getRawMany();

      for (const line of lines) {
        const deltaQty = parseFloat(line.quantity) || 0;
        const adjustmentAmount = parseFloat(line.amount) || 0;
        const unitCost = parseFloat(line.unitCost) || 0;

        if (deltaQty !== 0) {
          const isIn = String(line.type).toLowerCase() === "in";
          items.push({
            type: "INVENTORY_ADJUSTMENT",
            refType: InventoryTransactionRefType.ADJUST,
            refId: doc.refId,
            refCode: doc.refCode,
            occurredAt: new Date(doc.occurredAt),
            productId,
            warehouseId,
            quantity: Math.abs(deltaQty),
            amount: Math.abs(adjustmentAmount),
            unitCost,
            txType: isIn ? TransactionTypeEnum.IN : TransactionTypeEnum.OUT,
            companyId: doc.companyId,
          });
        }
      }
    }

    // Price adjustment must run before a purchase receipt at the same time.
    const priceHistories = await manager
      .createQueryBuilder()
      .select('ph.id', 'refId')
      .addSelect('ph."createdAt"', 'occurredAt')
      .addSelect('ph."priceDifference"', 'priceDifference')
      .addSelect('p."companyId"', 'companyId')
      .from('product_price_histories', 'ph')
      .innerJoin('products', 'p', 'p.id = ph."productId"')
      .where('ph."productId" = :productId', { productId })
      .andWhere('ph."isBaseUnit" = true')
      .andWhere('ph."priceDifference" <> 0')
      .andWhere('ph."createdAt" >= :fromDate', { fromDate })
      .andWhere('ph."deletedAt" IS NULL')
      .getRawMany();

    for (const history of priceHistories) {
      items.push({
        type: 'PRICE_ADJUSTMENT',
        refType: InventoryTransactionRefType.PRICE_ADJUSTMENT,
        refId: history.refId,
        refCode: `PRICE:${history.refId}`,
        occurredAt: new Date(history.occurredAt),
        productId,
        warehouseId,
        quantity: 0,
        amount: 0,
        unitCost: 0,
        priceDifference: Number(history.priceDifference) || 0,
        sortOrder: -100,
        txType: TransactionTypeEnum.IN,
        companyId: history.companyId,
      });
    }

    items.sort(
      (a, b) =>
        a.occurredAt.getTime() - b.occurredAt.getTime() ||
        (a.sortOrder || 0) - (b.sortOrder || 0),
    );

    return items;
  }

  /**
   * Rebuild 1 document thành transaction
   */
  private async rebuildDocument(
    item: {
      type: string;
      refType: InventoryTransactionRefType;
      refId: string;
      refCode: string;
      occurredAt: Date;
      productId: string;
      warehouseId: string;
      quantity: number;
      amount: number;
      unitCost: number;
      priceDifference?: number;
      txType: TransactionTypeEnum;
      companyId: string;
    },
    manager: EntityManager,
  ): Promise<void> {
    if (
      item.refType === InventoryTransactionRefType.PRICE_ADJUSTMENT &&
      item.priceDifference
    ) {
      const state = await this.getLatestStateAt(
        item.productId,
        item.warehouseId,
        item.occurredAt,
        manager,
      );
      const valueDelta = state.quantity * item.priceDifference;
      if (Math.abs(valueDelta) < 0.000001) return;
      item.txType =
        valueDelta >= 0 ? TransactionTypeEnum.IN : TransactionTypeEnum.OUT;
      item.amount = Math.abs(valueDelta);
    }

    await this.createFifoTransaction(
      {
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        type: item.txType,
        refType: item.refType,
        refId: item.refId,
        refCode: item.refCode,
        occurredAt: item.occurredAt,
        amount: item.amount,
        unitCost: item.unitCost,
        priceDifference: item.priceDifference,
        companyId: item.companyId,
      },
      manager,
    );
  }

  // =====================================================================
  // UTILITY: Find all impacted (product, warehouse) pairs from a date
  // =====================================================================

  /**
   * Tìm tất cả cặp (productId, warehouseId) bị ảnh hưởng từ fromDate
   */
  async findImpactedPairs(
    fromDate: Date,
    manager: EntityManager,
  ): Promise<Array<{ productId: string; warehouseId: string }>> {
    const pairs = await manager
      .getRepository(InventoryTransaction)
      .createQueryBuilder("it")
      .select('DISTINCT it."productId"', "productId")
      .addSelect('it."warehouseId"', "warehouseId")
      .where('it."occurredAt" >= :fromDate', { fromDate })
      .andWhere('it."deletedAt" IS NULL')
      .getRawMany<{ productId: string; warehouseId: string }>();

    return pairs;
  }

  /**
   * Recalculate toàn bộ hệ thống từ fromDate
   */
  async recalculateFromDate(
    fromDate: Date,
    manager: EntityManager,
  ): Promise<void> {
    const pairs = await this.findImpactedPairs(fromDate, manager);

    for (const pair of pairs) {
      try {
        await this.recalculateProductWarehouseFromDate(
          pair.productId,
          pair.warehouseId,
          fromDate,
          manager,
        );
      } catch (error) {
        logger.error(
          `[InventoryRecalculate] Failed recalculate pair (${pair.productId}, ${pair.warehouseId}): ${(error as Error)?.message}`,
        );
      }
    }

    // Batch update stockMetadata
    const productIds = [...new Set(pairs.map((p) => p.productId))];
    await this.stockMetadataHelper.batchUpdateStockMetadata(
      productIds,
      manager,
    );
  }

  // =====================================================================
  // JOB-BASED: savepoint/retry + collect affected nodes (dùng cho queue)
  // =====================================================================

  /**
   * Postgres deadlock detection (SQLSTATE 40P01) hoặc serialization failure (40001)
   */
  private isDeadlockError(error: unknown): boolean {
    const code = (error as any)?.code || (error as any)?.driverError?.code;
    return code === "40P01" || code === "40001";
  }

  /**
   * Wrap 1 document rebuild trong SAVEPOINT.
   * Khác với withSavepoint (nuốt lỗi): helper này RE-THROW để queue
   * biết cần retry/notify, tránh báo cáo tồn kho bị sai một cách âm thầm.
   */
  private async recalcWithSavepoint(
    manager: EntityManager,
    label: string,
    operation: () => Promise<void>,
  ): Promise<void> {
    const savepoint = `sp_inv_recalc_${Date.now()}_${Math.floor(
      Math.random() * 1e6,
    )}`;
    await manager.query(`SAVEPOINT "${savepoint}"`);
    try {
      await operation();
      await manager.query(`RELEASE SAVEPOINT "${savepoint}"`);
    } catch (error) {
      try {
        await manager.query(`ROLLBACK TO SAVEPOINT "${savepoint}"`);
        await manager.query(`RELEASE SAVEPOINT "${savepoint}"`);
      } catch (releaseError) {
        logger.warn(
          `[InventoryRecalculate] Release/rollback savepoint ${label} thất bại: ${
            (releaseError as Error)?.message || releaseError
          }`,
        );
      }
      throw error;
    }
  }

  /**
   * Nếu chưa nằm trong transaction → tự mở 1 transaction riêng cho node.
   * Giúp mỗi cặp (product, warehouse) atomically rebuild hoặc rollback hoàn toàn.
   */
  private async runRecalcInTransaction(
    manager: EntityManager,
    operation: (txManager: EntityManager) => Promise<void>,
  ): Promise<void> {
    const qr: any = (manager as any).queryRunner;
    const inTx = qr && qr.isTransactionActive;

    if (!inTx) {
      await manager.transaction(async (txManager) => {
        await operation(txManager);
      });
      return;
    }

    await operation(manager);
  }

  /**
   * Wrapper public cho queue worker: gọi recalculateProductWarehouseFromDate
   * bên trong transaction + auto-retry khi gặp deadlock.
   */
  async recalculateProductWarehouseFromDateWithRetry(
    productId: string,
    warehouseId: string,
    fromDate: Date,
    manager?: EntityManager,
    maxDeadlockRetries = 2,
  ): Promise<void> {
    const mainManager = manager || (await this.getManager());
    let attempt = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await this.runRecalcInTransaction(mainManager, async (txManager) => {
          await this.recalculateProductWarehouseFromDate(
            productId,
            warehouseId,
            fromDate,
            txManager,
          );
        });
        return;
      } catch (error) {
        if (!this.isDeadlockError(error) || attempt >= maxDeadlockRetries) {
          throw error;
        }
        attempt += 1;
        const backoffMs = 50 * Math.pow(2, attempt);
        logger.warn(
          `[InventoryRecalculate] Deadlock khi recalc product=${productId} warehouse=${warehouseId}, retry ${attempt}/${maxDeadlockRetries} sau ${backoffMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  /**
   * Mở rộng danh sách node bị ảnh hưởng từ 1 danh sách node gốc.
   * Khi 1 (product, warehouse) bị thay đổi → các warehouse lân cận qua
   * chuyển kho (warehouse_transfer) cũng cần được tính lại.
   */
  async collectAffectedInventoryNodes(
    nodes: InventoryRecalculateNode[],
    manager?: EntityManager,
  ): Promise<
    Array<{ productId: string; warehouseId: string; fromDate: Date }>
  > {
    if (!nodes?.length) {
      return [];
    }

    const mainManager = manager || (await this.getManager());

    const nodesByProduct = new Map<string, Map<string, Date>>();

    for (const node of nodes) {
      if (!node.productId || !node.warehouseId || !node.fromDate) {
        continue;
      }

      const normalizedFromDate = new Date(node.fromDate);
      if (Number.isNaN(normalizedFromDate.getTime())) {
        continue;
      }
      normalizedFromDate.setMilliseconds(0);

      const warehousesMap =
        nodesByProduct.get(node.productId) || new Map<string, Date>();
      const existingFromDate = warehousesMap.get(node.warehouseId);

      if (!existingFromDate || normalizedFromDate < existingFromDate) {
        warehousesMap.set(node.warehouseId, normalizedFromDate);
      }

      nodesByProduct.set(node.productId, warehousesMap);
    }

    for (const [productId, affectedWarehousesMap] of nodesByProduct.entries()) {
      const fromDates = Array.from(affectedWarehousesMap.values());
      if (!fromDates.length) {
        continue;
      }

      const minFromDate = new Date(
        Math.min(...fromDates.map((fromDate) => fromDate.getTime())),
      );

      const transferLines = await mainManager
        .createQueryBuilder(WarehouseTransferLine, "wtl")
        .leftJoinAndSelect("wtl.transfer", "t")
        .where("wtl.productId = :productId", { productId })
        .andWhere("t.timeAt >= :fromDate", { fromDate: minFromDate })
        .andWhere("wtl.deletedAt IS NULL")
        .andWhere("t.deletedAt IS NULL")
        .orderBy("t.timeAt", "ASC")
        .getMany();

      for (const line of transferLines) {
        const transfer = line.transfer;
        if (!transfer) {
          continue;
        }

        const transferAt = new Date(transfer.timeAt);
        transferAt.setMilliseconds(0);

        const fromWarehouseId = transfer.fromWarehouseId;
        const toWarehouseId = transfer.toWarehouseId;
        if (!fromWarehouseId || !toWarehouseId) {
          continue;
        }

        const sourceKnownAt = affectedWarehousesMap.get(fromWarehouseId);
        const targetKnownAt = affectedWarehousesMap.get(toWarehouseId);

        if (sourceKnownAt && sourceKnownAt <= transferAt) {
          const currentTargetAt = affectedWarehousesMap.get(toWarehouseId);
          if (!currentTargetAt || transferAt < currentTargetAt) {
            affectedWarehousesMap.set(toWarehouseId, transferAt);
          }
        }

        if (targetKnownAt && targetKnownAt <= transferAt) {
          const currentSourceAt = affectedWarehousesMap.get(fromWarehouseId);
          if (!currentSourceAt || transferAt < currentSourceAt) {
            affectedWarehousesMap.set(fromWarehouseId, transferAt);
          }
        }
      }
    }

    const result: Array<{
      productId: string;
      warehouseId: string;
      fromDate: Date;
    }> = [];

    for (const [productId, affectedWarehousesMap] of nodesByProduct.entries()) {
      for (const [warehouseId, fromDate] of affectedWarehousesMap.entries()) {
        result.push({ productId, warehouseId, fromDate });
      }
    }

    result.sort((a, b) => {
      if (a.productId !== b.productId) {
        return a.productId.localeCompare(b.productId);
      }
      return a.fromDate.getTime() - b.fromDate.getTime();
    });

    return result;
  }
}
