import { injectable } from "inversify";
import { TransactionService } from "@/shared/base/TransactionService";
import {
  InventoryTransaction,
  InventoryTransactionRefType,
} from "@/database/models/company/InventoryTransaction";
import { WarehouseTransfer } from "@/database/models/company/WarehouseTransfer";
import { Warehouse } from "@/database/models/company/Warehouse";
import { Product } from "@/database/models/company/Product";
import { EntityManager, Brackets, IsNull } from "typeorm";
import { ApiResponse } from "@/shared/types/interfaces";
import { TransactionType } from "@/shared/constants/enum";
import {
  GetStockReportQueryDto,
  GetTransactionDetailsQueryDto,
} from "./inventory.validator";
import { FileHelper } from "@/shared/utils/file.helper";

/**
 * Inventory Service
 * Báo cáo tồn kho và truy vấn transaction theo logic bình quân gia quyền
 * dựa trên inventory_transactions (running-state: quantityAfter, inventoryValueAfter).
 *
 * Nguyên tắc:
 * - 1 company có nhiều warehouse → báo cáo chính xác theo bộ lọc warehouseIds
 *   hoặc toàn bộ warehouse của company.
 * - Loại trừ chuyển kho nội bộ (cả 2 warehouse đều trong scope) để tránh
 *   tính trùng in/out.
 * - Tồn đầu kỳ / cuối kỳ được lấy từ quantityAfter, inventoryValueAfter
 *   của transaction gần nhất trước (hoặc tại) mốc thời gian.
 */
@injectable()
export class InventoryService extends TransactionService {
  /**
   * Báo cáo tồn kho theo product
   * Sử dụng SQL-based calculation để tối ưu performance
   */
  async getStockReport(params: GetStockReportQueryDto): Promise<ApiResponse> {
    try {
      const {
        storeId,
        keyword,
        page = 1,
        size = 20,
        warehouseIds,
        warehouseId,
        productIds,
        productCategoryIds,
        types,
        startAt,
        endAt,
        sortBy = "closingQuantity",
        sortOrder = "DESC",
      } = params;

      const manager = await this.getManager();

      /* ============================================
       * BƯỚC 1: Resolve danh sách warehouse trong scope
       * ============================================ */
      const allWarehouses = await manager.find(Warehouse, {
        where: { storeId, deletedAt: IsNull() },
      });

      const finalWarehouseIds = warehouseId
        ? [warehouseId]
        : warehouseIds?.length
          ? warehouseIds
          : allWarehouses.map((w) => w.id);

      if (finalWarehouseIds.length === 0) {
        return this.emptyStockResponse(page, size);
      }

      /* ============================================
       * BƯỚC 2: Lấy excluded transfer IDs
       * Loại trừ chuyển kho nội bộ (cả 2 kho đều trong scope)
       * ============================================ */
      let excludedTransferIds: string[] = [];

      const transfersQb = manager
        .createQueryBuilder(WarehouseTransfer, "t")
        .select("t.id")
        .where("t.storeId = :storeId", { storeId })
        .andWhere("t.deletedAt IS NULL")
        .andWhere("t.timeAt <= :endAt", { endAt })
        .andWhere("t.timeAt >= :startAt", { startAt });

      if (finalWarehouseIds.length > 0) {
        transfersQb
          .andWhere("t.fromWarehouseId IN (:...finalWarehouseIds)", {
            finalWarehouseIds,
          })
          .andWhere("t.toWarehouseId IN (:...finalWarehouseIds)", {
            finalWarehouseIds,
          });
      }

      const transfers = await transfersQb.getMany();
      excludedTransferIds = transfers.map((t) => t.id);

      /* ============================================
       * BƯỚC 3: Lấy danh sách products theo keyword
       * ============================================ */
      const computedFields = [
        "openingQuantity",
        "openingAmount",
        "inQuantity",
        "inAmount",
        "outQuantity",
        "outAmount",
        "closingQuantity",
        "closingAmount",
      ];
      const isComputedField = computedFields.includes(sortBy);

      const productsQb = manager
        .createQueryBuilder(Product, "product")
        .leftJoin("product.baseUnit", "baseUnit")
        .leftJoin("product.group", "group")
        .where("product.storeId = :storeId", { storeId })
        .andWhere("product.deletedAt IS NULL");

      if (keyword) {
        productsQb.andWhere(
          new Brackets((qb) => {
            qb.where("product.name ILIKE :keyword", {
              keyword: `%${keyword}%`,
            })
              .orWhere("product.code ILIKE :keyword", {
                keyword: `%${keyword}%`,
              })
              .orWhere("baseUnit.name ILIKE :keyword", {
                keyword: `%${keyword}%`,
              });
          }),
        );
      }

      if (productIds?.length) {
        productsQb.andWhere("product.id IN (:...productIds)", { productIds });
      }

      if (productCategoryIds?.length) {
        productsQb.andWhere("product.groupId IN (:...productCategoryIds)", {
          productCategoryIds,
        });
      }

      if (types?.length) {
        productsQb.andWhere("product.type IN (:...types)", { types });
      }

      const filteredProducts = await productsQb.getMany();

      if (!filteredProducts || filteredProducts.length === 0) {
        return this.emptyStockResponse(page, size);
      }

      const allowedProductIds = filteredProducts.map((p) => p.id);

      /* ============================================
       * BƯỚC 4: Build stock query theo transaction running-state
       * Tính theo từng warehouse rồi cộng lại theo product
       * ============================================ */
      const internalTransferExclusionSql =
        excludedTransferIds.length > 0
          ? ' AND NOT (tx."refType" = :refTypeTransfer AND tx."refId" IN (:...excludedTransferIds))'
          : "";

      const warehouseLevelQb = manager
        .getRepository(InventoryTransaction)
        .createQueryBuilder("tx")
        .select('tx."productId"', "productId")
        .addSelect('tx."warehouseId"', "warehouseId")
        .addSelect(
          `COALESCE((
            SELECT tx_open."quantityAfter"::float
            FROM inventory_transactions tx_open
            WHERE tx_open."productId" = tx."productId"
              AND tx_open."warehouseId" = tx."warehouseId"
              AND tx_open."storeId" = :storeId
              AND tx_open."deletedAt" IS NULL
              AND tx_open."occurredAt" < :startAt
            ORDER BY tx_open."occurredAt" DESC, tx_open."createdAt" DESC, tx_open."id" DESC
            LIMIT 1
          ), 0)`,
          "openingQuantity",
        )
        .addSelect(
          `COALESCE((
            SELECT tx_open."inventoryValueAfter"::float
            FROM inventory_transactions tx_open
            WHERE tx_open."productId" = tx."productId"
              AND tx_open."warehouseId" = tx."warehouseId"
              AND tx_open."storeId" = :storeId
              AND tx_open."deletedAt" IS NULL
              AND tx_open."occurredAt" < :startAt
            ORDER BY tx_open."occurredAt" DESC, tx_open."createdAt" DESC, tx_open."id" DESC
            LIMIT 1
          ), 0)`,
          "openingAmount",
        )
        .addSelect(
          `COALESCE(SUM(
            CASE
              WHEN tx."occurredAt" BETWEEN :startAt AND :endAt
                AND tx.type = :typeIn
                ${internalTransferExclusionSql}
              THEN tx.quantity
              ELSE 0
            END
          ), 0)::float`,
          "inQuantity",
        )
        .addSelect(
          `COALESCE(SUM(
            CASE
              WHEN tx."occurredAt" BETWEEN :startAt AND :endAt
                AND tx.type = :typeIn
                ${internalTransferExclusionSql}
              THEN tx.amount
              ELSE 0
            END
          ), 0)::float`,
          "inAmount",
        )
        .addSelect(
          `COALESCE(SUM(
            CASE
              WHEN tx."occurredAt" BETWEEN :startAt AND :endAt
                AND tx.type = :typeOut
                ${internalTransferExclusionSql}
              THEN tx.quantity
              ELSE 0
            END
          ), 0)::float`,
          "outQuantity",
        )
        .addSelect(
          `COALESCE(SUM(
            CASE
              WHEN tx."occurredAt" BETWEEN :startAt AND :endAt
                AND tx.type = :typeOut
                ${internalTransferExclusionSql}
              THEN tx.amount
              ELSE 0
            END
          ), 0)::float`,
          "outAmount",
        )
        .addSelect(
          `COALESCE((
            SELECT tx_close."quantityAfter"::float
            FROM inventory_transactions tx_close
            WHERE tx_close."productId" = tx."productId"
              AND tx_close."warehouseId" = tx."warehouseId"
              AND tx_close."storeId" = :storeId
              AND tx_close."deletedAt" IS NULL
              AND tx_close."occurredAt" <= :endAt
            ORDER BY tx_close."occurredAt" DESC, tx_close."createdAt" DESC, tx_close."id" DESC
            LIMIT 1
          ), 0)`,
          "closingQuantity",
        )
        .addSelect(
          `COALESCE((
            SELECT tx_close."inventoryValueAfter"::float
            FROM inventory_transactions tx_close
            WHERE tx_close."productId" = tx."productId"
              AND tx_close."warehouseId" = tx."warehouseId"
              AND tx_close."storeId" = :storeId
              AND tx_close."deletedAt" IS NULL
              AND tx_close."occurredAt" <= :endAt
            ORDER BY tx_close."occurredAt" DESC, tx_close."createdAt" DESC, tx_close."id" DESC
            LIMIT 1
          ), 0)`,
          "closingAmount",
        )
        .where('tx."storeId" = :storeId', { storeId })
        .andWhere('tx."deletedAt" IS NULL')
        .andWhere('tx."occurredAt" <= :endAt', { endAt })
        .groupBy('tx."productId"')
        .addGroupBy('tx."warehouseId"')
        .setParameters({
          startAt,
          endAt,
          storeId,
          typeIn: TransactionType.IN,
          typeOut: TransactionType.OUT,
          refTypeTransfer: InventoryTransactionRefType.TRANSFER,
        });

      if (excludedTransferIds.length > 0) {
        warehouseLevelQb.setParameter(
          "excludedTransferIds",
          excludedTransferIds,
        );
      }

      if (finalWarehouseIds.length > 0) {
        warehouseLevelQb.andWhere(
          'tx."warehouseId" IN (:...finalWarehouseIds)',
          { finalWarehouseIds },
        );
      }

      if (allowedProductIds.length > 0) {
        warehouseLevelQb.andWhere('tx."productId" IN (:...allowedProductIds)', {
          allowedProductIds,
        });
      }

      const mainQb = manager
        .createQueryBuilder()
        .select('"warehouse_stock"."productId"', "productId")
        .addSelect(
          'COALESCE(SUM("warehouse_stock"."openingQuantity"), 0)::float',
          "openingQuantity",
        )
        .addSelect(
          'COALESCE(SUM("warehouse_stock"."openingAmount"), 0)::float',
          "openingAmount",
        )
        .addSelect(
          'COALESCE(SUM("warehouse_stock"."inQuantity"), 0)::float',
          "inQuantity",
        )
        .addSelect(
          'COALESCE(SUM("warehouse_stock"."inAmount"), 0)::float',
          "inAmount",
        )
        .addSelect(
          'COALESCE(SUM("warehouse_stock"."outQuantity"), 0)::float',
          "outQuantity",
        )
        .addSelect(
          'COALESCE(SUM("warehouse_stock"."outAmount"), 0)::float',
          "outAmount",
        )
        .addSelect(
          'COALESCE(SUM("warehouse_stock"."closingQuantity"), 0)::float',
          "closingQuantity",
        )
        .addSelect(
          'COALESCE(SUM("warehouse_stock"."closingAmount"), 0)::float',
          "closingAmount",
        )
        .from("(" + warehouseLevelQb.getQuery() + ")", "warehouse_stock")
        .groupBy('"warehouse_stock"."productId"')
        .setParameters(warehouseLevelQb.getParameters());

      /* ============================================
       * BƯỚC 5: Build WHERE filter conditions cho computed fields
       * ============================================ */
      const whereConditions: string[] = [];
      const whereParams: any = {};

      const filterFields = [
        "openingQuantity",
        "openingAmount",
        "inQuantity",
        "inAmount",
        "outQuantity",
        "outAmount",
        "closingQuantity",
        "closingAmount",
      ];

      filterFields.forEach((field) => {
        const gte = params[`${field}Gte` as keyof GetStockReportQueryDto];
        const gt = params[`${field}Gt` as keyof GetStockReportQueryDto];
        const lte = params[`${field}Lte` as keyof GetStockReportQueryDto];
        const lt = params[`${field}Lt` as keyof GetStockReportQueryDto];
        const eq = params[`${field}Eq` as keyof GetStockReportQueryDto];

        if (gte !== undefined) {
          whereConditions.push(`"${field}" >= :${field}Gte`);
          whereParams[`${field}Gte`] = gte;
        }
        if (gt !== undefined) {
          whereConditions.push(`"${field}" > :${field}Gt`);
          whereParams[`${field}Gt`] = gt;
        }
        if (lte !== undefined) {
          whereConditions.push(`"${field}" <= :${field}Lte`);
          whereParams[`${field}Lte`] = lte;
        }
        if (lt !== undefined) {
          whereConditions.push(`"${field}" < :${field}Lt`);
          whereParams[`${field}Lt`] = lt;
        }
        if (eq !== undefined) {
          whereConditions.push(`"${field}" = :${field}Eq`);
          whereParams[`${field}Eq`] = eq;
        }
      });

      /* ============================================
       * BƯỚC 6: Build summary TRƯỚC KHI apply WHERE filter
       * Summary phải tính từ toàn bộ filtered data (chỉ exclude internal transfers)
       * ============================================ */
      const summaryQb = manager
        .createQueryBuilder()
        .select('COALESCE(SUM("openingQuantity"), 0)::float', "openingQuantity")
        .addSelect('COALESCE(SUM("openingAmount"), 0)::float', "openingAmount")
        .addSelect('COALESCE(SUM("inQuantity"), 0)::float', "inQuantity")
        .addSelect('COALESCE(SUM("inAmount"), 0)::float', "inAmount")
        .addSelect('COALESCE(SUM("outQuantity"), 0)::float', "outQuantity")
        .addSelect('COALESCE(SUM("outAmount"), 0)::float', "outAmount")
        .addSelect(
          'COALESCE(SUM("closingQuantity"), 0)::float',
          "closingQuantity",
        )
        .addSelect('COALESCE(SUM("closingAmount"), 0)::float', "closingAmount")
        .addSelect(
          'COUNT(CASE WHEN "closingQuantity" = 0 THEN 1 END)::int',
          "outOfStockItems",
        )
        .from("(" + mainQb.getQuery() + ")", "stock")
        .setParameters(mainQb.getParameters());

      const summary = await summaryQb.getRawOne();

      /* ============================================
       * BƯỚC 7: Get total count TRƯỚC để tính totalPages
       * và clamp currentPage trước khi paginate data.
       * ============================================ */
      const countQb = manager
        .createQueryBuilder()
        .select("COUNT(*)", "total")
        .from("(" + mainQb.getQuery() + ")", "stock")
        .setParameters(mainQb.getParameters());

      if (whereConditions.length > 0) {
        countQb.where(whereConditions.join(" AND ")).setParameters(whereParams);
      }

      const { total } = await countQb.getRawOne();
      const totalCount = Number(total);
      const totalPages = Math.ceil(totalCount / size);
      const currentPage = Math.min(page, totalPages) || 1;

      /* ============================================
       * BƯỚC 8: Build pagination + sort query với WHERE filter
       * ============================================ */
      const dataQb = manager
        .createQueryBuilder()
        .select("*")
        .from("(" + mainQb.getQuery() + ")", "stock")
        .setParameters(mainQb.getParameters());

      if (whereConditions.length > 0) {
        dataQb.where(whereConditions.join(" AND ")).setParameters(whereParams);
      }

      dataQb.offset((currentPage - 1) * size).limit(size);

      if (isComputedField) {
        dataQb.orderBy(`"${sortBy}"`, sortOrder as "ASC" | "DESC");
      }

      const stockData = await dataQb.getRawMany();

      /* ============================================
       * BƯỚC 9: Load products + enrich
       * ============================================ */
      if (stockData.length === 0) {
        return {
          message: "No stock data found.",
          statusCode: 200,
          success: true,
          data: [],
          pagination: {
            currentPage,
            size,
            totalRecords: totalCount,
            totalPages,
          },
          summary,
        };
      }

      const productIdsForPage = stockData.map((row: any) => row.productId);
      const productsForPage = await manager
        .createQueryBuilder(Product, "product")
        .leftJoinAndSelect("product.baseUnit", "baseUnit")
        .leftJoinAndSelect("product.group", "group")
        .where("product.id IN (:...productIdsForPage)", {
          productIdsForPage,
        })
        .andWhere("product.deletedAt IS NULL")
        .getMany();

      const productMap = new Map(
        productsForPage.map((product) => [product.id, product]),
      );

      const products = stockData
        .map((row: any) => {
          const product = productMap.get(row.productId);
          if (!product) return null;

          return {
            ...product,
            openingQuantity: Number(row.openingQuantity) || 0,
            openingAmount: Number(row.openingAmount) || 0,
            inQuantity: Number(row.inQuantity) || 0,
            inAmount: Number(row.inAmount) || 0,
            outQuantity: Number(row.outQuantity) || 0,
            outAmount: Number(row.outAmount) || 0,
            closingQuantity: Number(row.closingQuantity) || 0,
            closingAmount: Number(row.closingAmount) || 0,
          };
        })
        .filter(Boolean) as any[];

      /* ============================================
       * BƯỚC 10: Sort products
       * ============================================ */
      if (isComputedField) {
        products.sort((a: any, b: any) => {
          const aValue = a[sortBy] ?? 0;
          const bValue = b[sortBy] ?? 0;
          return sortOrder === "ASC" ? aValue - bValue : bValue - aValue;
        });
      } else {
        products.sort((a: any, b: any) => {
          let aValue = a[sortBy];
          let bValue = b[sortBy];

          if (sortBy.includes(".")) {
            const parts = sortBy.split(".");
            aValue = parts.reduce((obj: any, key: string) => obj?.[key], a);
            bValue = parts.reduce((obj: any, key: string) => obj?.[key], b);
          }

          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return sortOrder === "ASC" ? 1 : -1;
          if (bValue == null) return sortOrder === "ASC" ? -1 : 1;

          if (typeof aValue === "string" && typeof bValue === "string") {
            const compareResult = aValue.localeCompare(bValue);
            return sortOrder === "ASC" ? compareResult : -compareResult;
          } else {
            const compareResult =
              aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            return sortOrder === "ASC" ? compareResult : -compareResult;
          }
        });
      }

      /* ============================================
       * BƯỚC 11: Attach files to products
       * ============================================ */
      const finalProducts = await FileHelper.attachFilesToEntities(
        products as any,
      );

      return {
        message: "Stock report retrieved successfully.",
        statusCode: 200,
        success: true,
        data: finalProducts,
        pagination: {
          currentPage,
          size,
          totalRecords: totalCount,
          totalPages,
        },
        summary,
      };
    } catch (error) {
      console.error("Error in getStockReport:", error);
      throw error;
    }
  }

  /**
   * Chi tiết transactions (nhập xuất tồn) của một sản phẩm
   */
  async getTransactionDetails(
    params: GetTransactionDetailsQueryDto,
  ): Promise<ApiResponse<InventoryTransaction[]>> {
    const {
      storeId,
      productId,
      warehouseIds = [],
      warehouseId,
      startAt,
      endAt,
      page = 1,
      size = 20,
      refType,
    } = params;

    const finalWarehouseIds = warehouseId ? [warehouseId] : warehouseIds;

    const manager = await this.getManager();

    /* --------------------------------------------
     * 1️⃣ Calculate stock by transaction running-state
     * -------------------------------------------- */
    const stockMap = await this.calculateStockForProducts(
      [productId],
      finalWarehouseIds,
      storeId!,
      startAt,
      endAt,
      manager,
    );

    /* --------------------------------------------
     * 2️⃣ Tìm các phiếu chuyển kho ngoại lệ
     * (cả 2 kho đều thuộc scope finalWarehouseIds)
     * -------------------------------------------- */
    let excludedTransferIds: string[] = [];

    const resolvedWarehouseIds =
      finalWarehouseIds.length > 0
        ? finalWarehouseIds
        : (
            await manager.find(Warehouse, {
              where: { storeId, deletedAt: IsNull() },
            })
          ).map((w) => w.id);

    const transfersQb = manager
      .createQueryBuilder(WarehouseTransfer, "t")
      .select("t.id")
      .where("t.storeId = :storeId", { storeId })
      .andWhere("t.deletedAt IS NULL")
      .andWhere("t.timeAt >= :startAt", { startAt })
      .andWhere("t.timeAt <= :endAt", { endAt });

    if (resolvedWarehouseIds.length > 0) {
      transfersQb
        .andWhere("t.fromWarehouseId IN (:...resolvedWarehouseIds)", {
          resolvedWarehouseIds,
        })
        .andWhere("t.toWarehouseId IN (:...resolvedWarehouseIds)", {
          resolvedWarehouseIds,
        });
    }

    const transfers = await transfersQb.getMany();
    excludedTransferIds = transfers.map((t) => t.id);

    /* --------------------------------------------
     * 3️⃣ Query TẤT CẢ transactions trong kỳ (CHƯA filter refType)
     *    Lý do: closingQuantity/Amount phải được tính trên running-state
     *    đầy đủ (gồm cả IN/OUT, mọi refType). Filter refType sẽ được áp
     *    SAU khi đã gắn closing.
     * -------------------------------------------- */
    const txQb = manager
      .createQueryBuilder(InventoryTransaction, "tx")
      .where('tx."storeId" = :storeId', { storeId })
      .andWhere('tx."deletedAt" IS NULL')
      .andWhere('tx."productId" = :productId', { productId })
      .andWhere("tx.occurredAt BETWEEN :startAt AND :endAt", {
        startAt,
        endAt,
      })
      .orderBy("tx.occurredAt", "ASC")
      .addOrderBy("tx.createdAt", "ASC")
      .addOrderBy("tx.id", "ASC");

    if (excludedTransferIds.length > 0) {
      txQb.andWhere(
        "NOT (tx.refType = :transferType AND tx.refId IN (:...excludedIds))",
        {
          transferType: InventoryTransactionRefType.TRANSFER,
          excludedIds: excludedTransferIds,
        },
      );
    }

    if (finalWarehouseIds.length > 0) {
      txQb.andWhere('tx."warehouseId" IN (:...finalWarehouseIds)', {
        finalWarehouseIds,
      });
    }

    const allTransactions = await txQb.getMany();

    // Calculate opening balance from stockMap
    let openingQuantityTotal = 0;
    let openingAmountTotal = 0;
    stockMap.forEach((stock) => {
      openingQuantityTotal += stock.openingQuantity;
      openingAmountTotal += stock.openingAmount;
    });

    // Tính running state trên TOÀN BỘ transactions trong kỳ
    let runningQuantity = openingQuantityTotal;
    let runningAmount = openingAmountTotal;

    allTransactions.forEach((tx) => {
      const isIn = tx.type === TransactionType.IN;
      runningQuantity += isIn ? tx.quantity : -tx.quantity;
      runningAmount += isIn ? tx.amount : -tx.amount;

      (tx as any).closingQuantity = runningQuantity;
      (tx as any).closingAmount = runningAmount;
    });

    // Áp filter refType SAU khi đã gắn closingQuantity/Amount
    const filteredTransactions = refType
      ? allTransactions.filter((tx) => tx.refType === refType)
      : allTransactions;

    const totalRecords = filteredTransactions.length;
    const totalPages = Math.ceil(totalRecords / size);
    const currentPage = Math.min(page, totalPages) || 1;

    // Apply pagination trên tập đã filter
    const offset = ((currentPage || 1) - 1) * size;
    const transactions = filteredTransactions.slice(offset, offset + size);

    // Attach product + warehouse info (FE InventoryTransaction cần `product`)
    const productIdsInTx = Array.from(
      new Set(transactions.map((tx) => tx.productId)),
    );

    let productsForTx: Product[] = [];
    if (productIdsInTx.length > 0) {
      productsForTx = await manager
        .getRepository(Product)
        .createQueryBuilder("product")
        .where("product.id IN (:...productIdsInTx)", { productIdsInTx })
        .andWhere("product.deletedAt IS NULL")
        .getMany();
    }

    const productMap = new Map(productsForTx.map((p) => [p.id, p]));

    const warehouseIdsInTx = Array.from(
      new Set(transactions.map((tx) => tx.warehouseId)),
    );

    let warehouses: Warehouse[] = [];
    if (warehouseIdsInTx.length > 0) {
      warehouses = await manager
        .getRepository(Warehouse)
        .createQueryBuilder("warehouse")
        .where("warehouse.id IN (:...warehouseIdsInTx)", {
          warehouseIdsInTx,
        })
        .andWhere("warehouse.deletedAt IS NULL")
        .getMany();
    }

    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));
    transactions.forEach((tx) => {
      (tx as any).product = productMap.get(tx.productId);
      (tx as any).warehouse = warehouseMap.get(tx.warehouseId);
    });

    /* --------------------------------------------
     * 4️⃣ Build summary (from stockMap)
     * -------------------------------------------- */
    let openingQuantity = 0;
    let openingAmount = 0;
    let totalInQuantity = 0;
    let totalInAmount = 0;
    let totalOutQuantity = 0;
    let totalOutAmount = 0;
    let closingQuantity = 0;
    let closingAmount = 0;

    stockMap.forEach((stock) => {
      openingQuantity += stock.openingQuantity;
      openingAmount += stock.openingAmount;

      totalInQuantity += stock.inQuantity;
      totalInAmount += stock.inAmount;

      totalOutQuantity += stock.outQuantity;
      totalOutAmount += stock.outAmount;

      closingQuantity += stock.closingQuantity;
      closingAmount += stock.closingAmount;
    });

    /* --------------------------------------------
     * 5️⃣ Return
     * -------------------------------------------- */
    return {
      message: "Lấy chi tiết giao dịch thành công.",
      statusCode: 200,
      success: true,
      data: transactions,
      pagination: {
        currentPage,
        size,
        totalRecords,
        totalPages,
      },
      summary: {
        openingQuantity,
        openingAmount,
        totalInQuantity,
        totalInAmount,
        totalOutQuantity,
        totalOutAmount,
        closingQuantity,
        closingAmount,
      },
    };
  }

  /**
   * Tính tồn kho cho danh sách products
   * Trả về Map<productId, stockData>
   */
  private async calculateStockForProducts(
    productIds: string[],
    warehouseIds: string[],
    storeId: string,
    startAt: Date,
    endAt: Date,
    manager?: EntityManager,
  ): Promise<
    Map<
      string,
      {
        openingQuantity: number;
        openingAmount: number;
        inQuantity: number;
        inAmount: number;
        outQuantity: number;
        outAmount: number;
        closingQuantity: number;
        closingAmount: number;
      }
    >
  > {
    const resultMap = new Map<
      string,
      {
        openingQuantity: number;
        openingAmount: number;
        inQuantity: number;
        inAmount: number;
        outQuantity: number;
        outAmount: number;
        closingQuantity: number;
        closingAmount: number;
      }
    >();

    if (productIds.length === 0) {
      return resultMap;
    }

    const mainManager = manager || (await this.getManager());

    const resolvedWarehouseIds =
      warehouseIds.length > 0
        ? warehouseIds
        : (
            await mainManager.find(Warehouse, {
              where: { storeId, deletedAt: IsNull() },
            })
          ).map((w) => w.id);

    /* --------------------------------------------
     * Tìm excluded transfer IDs
     * -------------------------------------------- */
    let excludedTransferIds: string[] = [];
    const transfersQb = mainManager
      .createQueryBuilder(WarehouseTransfer, "t")
      .select("t.id")
      .where("t.storeId = :storeId", { storeId })
      .andWhere("t.deletedAt IS NULL")
      .andWhere("t.timeAt >= :startAt", { startAt })
      .andWhere("t.timeAt <= :endAt", { endAt });

    if (resolvedWarehouseIds.length > 0) {
      transfersQb
        .andWhere("t.fromWarehouseId IN (:...resolvedWarehouseIds)", {
          resolvedWarehouseIds,
        })
        .andWhere("t.toWarehouseId IN (:...resolvedWarehouseIds)", {
          resolvedWarehouseIds,
        });
    }

    const transfers = await transfersQb.getMany();
    excludedTransferIds = transfers.map((t) => t.id);

    const internalTransferExclusionSql =
      excludedTransferIds.length > 0
        ? ' AND NOT (tx."refType" = :refTypeTransfer AND tx."refId" IN (:...excludedTransferIds))'
        : "";

    /* --------------------------------------------
     * Build warehouse-level stock query
     * -------------------------------------------- */
    const warehouseLevelQb = mainManager
      .getRepository(InventoryTransaction)
      .createQueryBuilder("tx")
      .select('tx."productId"', "productId")
      .addSelect('tx."warehouseId"', "warehouseId")
      .addSelect(
        `COALESCE((
          SELECT tx_open."quantityAfter"::float
          FROM inventory_transactions tx_open
          WHERE tx_open."productId" = tx."productId"
            AND tx_open."warehouseId" = tx."warehouseId"
            AND tx_open."storeId" = :storeId
            AND tx_open."deletedAt" IS NULL
            AND tx_open."occurredAt" < :startAt
          ORDER BY tx_open."occurredAt" DESC, tx_open."createdAt" DESC, tx_open."id" DESC
          LIMIT 1
        ), 0)`,
        "openingQuantity",
      )
      .addSelect(
        `COALESCE((
          SELECT tx_open."inventoryValueAfter"::float
          FROM inventory_transactions tx_open
          WHERE tx_open."productId" = tx."productId"
            AND tx_open."warehouseId" = tx."warehouseId"
            AND tx_open."storeId" = :storeId
            AND tx_open."deletedAt" IS NULL
            AND tx_open."occurredAt" < :startAt
          ORDER BY tx_open."occurredAt" DESC, tx_open."createdAt" DESC, tx_open."id" DESC
          LIMIT 1
        ), 0)`,
        "openingAmount",
      )
      .addSelect(
        `COALESCE(SUM(
          CASE
            WHEN tx."occurredAt" BETWEEN :startAt AND :endAt
              AND tx.type = :typeIn
              ${internalTransferExclusionSql}
            THEN tx.quantity
            ELSE 0
          END
        ), 0)::float`,
        "inQuantity",
      )
      .addSelect(
        `COALESCE(SUM(
          CASE
            WHEN tx."occurredAt" BETWEEN :startAt AND :endAt
              AND tx.type = :typeIn
              ${internalTransferExclusionSql}
            THEN tx.amount
            ELSE 0
          END
        ), 0)::float`,
        "inAmount",
      )
      .addSelect(
        `COALESCE(SUM(
          CASE
            WHEN tx."occurredAt" BETWEEN :startAt AND :endAt
              AND tx.type = :typeOut
              ${internalTransferExclusionSql}
            THEN tx.quantity
            ELSE 0
          END
        ), 0)::float`,
        "outQuantity",
      )
      .addSelect(
        `COALESCE(SUM(
          CASE
            WHEN tx."occurredAt" BETWEEN :startAt AND :endAt
              AND tx.type = :typeOut
              ${internalTransferExclusionSql}
            THEN tx.amount
            ELSE 0
          END
        ), 0)::float`,
        "outAmount",
      )
      .addSelect(
        `COALESCE((
          SELECT tx_close."quantityAfter"::float
          FROM inventory_transactions tx_close
          WHERE tx_close."productId" = tx."productId"
            AND tx_close."warehouseId" = tx."warehouseId"
            AND tx_close."storeId" = :storeId
            AND tx_close."deletedAt" IS NULL
            AND tx_close."occurredAt" <= :endAt
          ORDER BY tx_close."occurredAt" DESC, tx_close."createdAt" DESC, tx_close."id" DESC
          LIMIT 1
        ), 0)`,
        "closingQuantity",
      )
      .addSelect(
        `COALESCE((
          SELECT tx_close."inventoryValueAfter"::float
          FROM inventory_transactions tx_close
          WHERE tx_close."productId" = tx."productId"
            AND tx_close."warehouseId" = tx."warehouseId"
            AND tx_close."storeId" = :storeId
            AND tx_close."deletedAt" IS NULL
            AND tx_close."occurredAt" <= :endAt
          ORDER BY tx_close."occurredAt" DESC, tx_close."createdAt" DESC, tx_close."id" DESC
          LIMIT 1
        ), 0)`,
        "closingAmount",
      )
      .where('tx."productId" IN (:...productIds)', { productIds })
      .andWhere('tx."storeId" = :storeId', { storeId })
      .andWhere('tx."deletedAt" IS NULL')
      .andWhere('tx."occurredAt" <= :endAt', { endAt })
      .groupBy('tx."productId"')
      .addGroupBy('tx."warehouseId"')
      .setParameters({
        startAt,
        endAt,
        storeId,
        typeIn: TransactionType.IN,
        typeOut: TransactionType.OUT,
        refTypeTransfer: InventoryTransactionRefType.TRANSFER,
      });

    if (resolvedWarehouseIds.length > 0) {
      warehouseLevelQb.andWhere(
        'tx."warehouseId" IN (:...resolvedWarehouseIds)',
        { resolvedWarehouseIds },
      );
    }

    if (excludedTransferIds.length > 0) {
      warehouseLevelQb.setParameter("excludedTransferIds", excludedTransferIds);
    }

    const productLevelRows = await mainManager
      .createQueryBuilder()
      .select('"warehouse_stock"."productId"', "productId")
      .addSelect(
        'COALESCE(SUM("warehouse_stock"."openingQuantity"), 0)::float',
        "openingQuantity",
      )
      .addSelect(
        'COALESCE(SUM("warehouse_stock"."openingAmount"), 0)::float',
        "openingAmount",
      )
      .addSelect(
        'COALESCE(SUM("warehouse_stock"."inQuantity"), 0)::float',
        "inQuantity",
      )
      .addSelect(
        'COALESCE(SUM("warehouse_stock"."inAmount"), 0)::float',
        "inAmount",
      )
      .addSelect(
        'COALESCE(SUM("warehouse_stock"."outQuantity"), 0)::float',
        "outQuantity",
      )
      .addSelect(
        'COALESCE(SUM("warehouse_stock"."outAmount"), 0)::float',
        "outAmount",
      )
      .addSelect(
        'COALESCE(SUM("warehouse_stock"."closingQuantity"), 0)::float',
        "closingQuantity",
      )
      .addSelect(
        'COALESCE(SUM("warehouse_stock"."closingAmount"), 0)::float',
        "closingAmount",
      )
      .from("(" + warehouseLevelQb.getQuery() + ")", "warehouse_stock")
      .groupBy('"warehouse_stock"."productId"')
      .setParameters(warehouseLevelQb.getParameters())
      .getRawMany();

    productLevelRows.forEach((row: any) => {
      resultMap.set(row.productId, {
        openingQuantity: Number(row.openingQuantity) || 0,
        openingAmount: Number(row.openingAmount) || 0,
        inQuantity: Number(row.inQuantity) || 0,
        inAmount: Number(row.inAmount) || 0,
        outQuantity: Number(row.outQuantity) || 0,
        outAmount: Number(row.outAmount) || 0,
        closingQuantity: Number(row.closingQuantity) || 0,
        closingAmount: Number(row.closingAmount) || 0,
      });
    });

    productIds.forEach((productId) => {
      if (!resultMap.has(productId)) {
        resultMap.set(productId, {
          openingQuantity: 0,
          openingAmount: 0,
          inQuantity: 0,
          inAmount: 0,
          outQuantity: 0,
          outAmount: 0,
          closingQuantity: 0,
          closingAmount: 0,
        });
      }
    });

    return resultMap;
  }

  /**
   * Trả về response rỗng chuẩn cho stock report
   */
  private emptyStockResponse(page: number, size: number): ApiResponse {
    return {
      message: "No products found.",
      statusCode: 200,
      success: true,
      data: [],
      pagination: {
        currentPage: Math.min(page, 0) || 1,
        size,
        totalRecords: 0,
        totalPages: 0,
      },
      summary: {
        openingQuantity: 0,
        openingAmount: 0,
        inQuantity: 0,
        inAmount: 0,
        outQuantity: 0,
        outAmount: 0,
        closingQuantity: 0,
        closingAmount: 0,
        outOfStockItems: 0,
      },
    };
  }
}
