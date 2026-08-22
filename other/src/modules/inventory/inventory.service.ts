import { inject, injectable } from "inversify";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { Store } from "@/database/models/Store";
import { EntityManager } from "typeorm";
import { PRODUCT_TYPES } from "../product/product.types";
import { ProductRepository } from "../product/product.repository";
import { Product } from "@/database/models/Product";
import { ProductVariant } from "@/database/models/ProductVariant";
import {
  GetStockReportQueryDto,
  GetTransactionDetailsQueryDto,
} from "./inventory.validator";
import { ApiResponse } from "@/shared/types/interfaces";
import {
  InventoryRefTypeEnum,
  InventoryTransactionTypeEnum,
} from "@/shared/constants/enum";
import { TransactionService } from "@/shared/base/TransactionService";
import { FileHelper } from "@/shared/utils/file.helper";
import { config } from "@/config/env";
import { LowStockProduct } from "../dashboard/dashboard.interface";
import { ATTRIBUTE_TYPES } from "../attribute/attribute.types";
import { AttributeRepository } from "../attribute/attribute.repository";

/**
 * Stock data cho variant
 */
interface VariantStockData {
  stockQty: number;
  stockValue: number;
}

/**
 * Inventory Service
 * Quản lý tồn kho, transaction và báo cáo theo logic bình quân gia quyền dựa trên inventory_transactions
 */
@injectable()
export class InventoryService extends TransactionService {
  constructor(
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepo: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    protected attributeRepo: AttributeRepository,
  ) {
    super();
  }

  /**
   * Báo cáo tồn kho theo product/variant
   * Toàn bộ tính toán, lọc, sort, phân trang đều thực hiện ở database
   */
  async getStockReport(params: GetStockReportQueryDto): Promise<ApiResponse> {
    try {
      const {
        keyword,
        page = 1,
        size = 20,
        productCategoryIds,
        storeIds,
        storeId,
        startAt,
        endAt,
        sortBy = "closingQty",
        sortOrder = "DESC",
      } = params;
      const finalStoreIds: string[] = storeId ? [storeId] : storeIds || [];
      const manager = await this.getManager();

      // ===== BƯỚC 1: Resolve store scope =====
      let resolvedStoreIds: string[] = [...finalStoreIds];
      if (resolvedStoreIds.length === 0) {
        const allStores = await manager
          .createQueryBuilder(Store, "w")
          .select("w.id")
          .getMany();
        resolvedStoreIds = allStores.map((s) => s.id);
      }
      if (resolvedStoreIds.length === 0) {
        return this.emptyStockReportResponse(page, size);
      }

      // ===== BƯỚC 2: Excluded transfer IDs =====
      const excludedTransferIds = await this.findExcludedTransferIds(
        manager,
        resolvedStoreIds,
        endAt,
      );

      // ===== BƯỚC 3: Whitelist sortBy =====
      const ALLOWED_SORT_FIELDS = [
        "openingQty",
        "openingAmount",
        "increaseQty",
        "increaseAmount",
        "decreaseQty",
        "decreaseAmount",
        "closingQty",
        "closingAmount",
        "productName",
        "productCode",
      ];
      const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy)
        ? sortBy
        : "closingQty";
      const safeSortOrder = sortOrder === "ASC" ? "ASC" : "DESC";

      // ===== BƯỚC 4: Build SQL =====
      const sqlParams: any[] = [];
      const $ = (val: any): number => {
        sqlParams.push(val);
        return sqlParams.length;
      };

      // --- CTE: variant_stock ---
      const startAtIdx = $(startAt);
      const endAtIdx = $(endAt);
      const inTypeIdx = $(InventoryTransactionTypeEnum.IN);
      const outTypeIdx = $(InventoryTransactionTypeEnum.OUT);
      const storeArrIdx = $(resolvedStoreIds);

      // Excluded transfer filter
      let excludedTransferSQL = "";
      if (excludedTransferIds.length > 0) {
        const transferTypeIdx = $(InventoryRefTypeEnum.TRANSFER);
        const excludedArrIdx = $(excludedTransferIds);
        excludedTransferSQL = `AND NOT (tx."refType" = $${transferTypeIdx} AND tx."refId" = ANY($${excludedArrIdx}::uuid[]))`;
      }

      const variantStockCTE = `
        "variant_stock" AS (
          SELECT
            tx."productVariantId" AS "variantId",
            COALESCE(SUM(CASE
              WHEN tx."occurredAt" < $${startAtIdx}::timestamptz
              THEN CASE WHEN tx."type" = $${inTypeIdx} THEN tx."quantity" ELSE -tx."quantity" END
              ELSE 0
            END), 0)::float AS "openingQty",
            COALESCE(SUM(CASE
              WHEN tx."occurredAt" < $${startAtIdx}::timestamptz
              THEN CASE WHEN tx."type" = $${inTypeIdx} THEN tx."amount" ELSE -tx."amount" END
              ELSE 0
            END), 0)::float AS "openingAmount",
            COALESCE(SUM(CASE
              WHEN tx."occurredAt" >= $${startAtIdx}::timestamptz
               AND tx."occurredAt" <= $${endAtIdx}::timestamptz
               AND tx."type" = $${inTypeIdx}
              THEN tx."quantity"
              ELSE 0
            END), 0)::float AS "increaseQty",
            COALESCE(SUM(CASE
              WHEN tx."occurredAt" >= $${startAtIdx}::timestamptz
               AND tx."occurredAt" <= $${endAtIdx}::timestamptz
               AND tx."type" = $${inTypeIdx}
              THEN tx."amount"
              ELSE 0
            END), 0)::float AS "increaseAmount",
            COALESCE(SUM(CASE
              WHEN tx."occurredAt" >= $${startAtIdx}::timestamptz
               AND tx."occurredAt" <= $${endAtIdx}::timestamptz
               AND tx."type" = $${outTypeIdx}
              THEN tx."quantity"
              ELSE 0
            END), 0)::float AS "decreaseQty",
            COALESCE(SUM(CASE
              WHEN tx."occurredAt" >= $${startAtIdx}::timestamptz
               AND tx."occurredAt" <= $${endAtIdx}::timestamptz
               AND tx."type" = $${outTypeIdx}
              THEN tx."amount"
              ELSE 0
            END), 0)::float AS "decreaseAmount",
            COALESCE(SUM(CASE
              WHEN tx."occurredAt" <= $${endAtIdx}::timestamptz
              THEN CASE WHEN tx."type" = $${inTypeIdx} THEN tx."quantity" ELSE -tx."quantity" END
              ELSE 0
            END), 0)::float AS "closingQty",
            COALESCE(SUM(CASE
              WHEN tx."occurredAt" <= $${endAtIdx}::timestamptz
              THEN CASE WHEN tx."type" = $${inTypeIdx} THEN tx."amount" ELSE -tx."amount" END
              ELSE 0
            END), 0)::float AS "closingAmount"
          FROM inventory_transactions tx
          WHERE tx."storeId" = ANY($${storeArrIdx}::uuid[])
            AND tx."occurredAt" <= $${endAtIdx}::timestamptz
            AND tx."deletedAt" IS NULL
            ${excludedTransferSQL}
          GROUP BY tx."productVariantId"
        )`;

      // --- JOIN + base WHERE ---
      let joinAndWhere = `
        FROM "variant_stock" vs
        INNER JOIN product_variants pv ON pv."id" = vs."variantId" AND pv."deletedAt" IS NULL
        INNER JOIN products p ON p."id" = pv."productId" AND p."deletedAt" IS NULL
        LEFT JOIN attributes unit_attr ON unit_attr."id" = p."unitId" AND unit_attr."deletedAt" IS NULL
        LEFT JOIN attributes cat_attr ON cat_attr."id" = p."categoryId" AND cat_attr."deletedAt" IS NULL
        WHERE (vs."openingQty" != 0 OR vs."increaseQty" != 0 OR vs."decreaseQty" != 0 OR vs."closingQty" != 0)
      `;

      // --- Keyword filter ---
      if (keyword) {
        const kwIdx = $(`%${keyword}%`);
        joinAndWhere += `
          AND (
            unaccent(LOWER(p."name")) ILIKE unaccent(LOWER($${kwIdx}))
            OR unaccent(LOWER(p."code")) ILIKE unaccent(LOWER($${kwIdx}))
            OR unaccent(LOWER(COALESCE(unit_attr."name", ''))) ILIKE unaccent(LOWER($${kwIdx}))
            OR unaccent(LOWER(COALESCE(cat_attr."name", ''))) ILIKE unaccent(LOWER($${kwIdx}))
          )
        `;
      }

      // --- Category filter ---
      if (productCategoryIds && productCategoryIds.length > 0) {
        const categoryFamilyIds =
          await this.attributeRepo.collectProductCategoryFamilyIds(
            productCategoryIds,
          );
        const catIdx = $(categoryFamilyIds);
        joinAndWhere += ` AND p."categoryId" = ANY($${catIdx}::uuid[])`;
      }

      // --- Computed field filters ---
      const computedFields = [
        "openingQty",
        "openingAmount",
        "increaseQty",
        "increaseAmount",
        "decreaseQty",
        "decreaseAmount",
        "closingQty",
        "closingAmount",
      ];
      for (const field of computedFields) {
        const gte = (params as any)[`${field}Gte`];
        const gt = (params as any)[`${field}Gt`];
        const lte = (params as any)[`${field}Lte`];
        const lt = (params as any)[`${field}Lt`];
        const eq = (params as any)[`${field}Eq`];

        if (gte !== undefined) {
          joinAndWhere += ` AND vs."${field}" >= $${$(gte)}`;
        }
        if (gt !== undefined) {
          joinAndWhere += ` AND vs."${field}" > $${$(gt)}`;
        }
        if (lte !== undefined) {
          joinAndWhere += ` AND vs."${field}" <= $${$(lte)}`;
        }
        if (lt !== undefined) {
          joinAndWhere += ` AND vs."${field}" < $${$(lt)}`;
        }
        if (eq !== undefined) {
          joinAndWhere += ` AND vs."${field}" = $${$(eq)}`;
        }
      }

      // ===== BƯỚC 5: Select columns =====
      const selectColumns = `
        vs."variantId",
        vs."openingQty", vs."openingAmount",
        vs."increaseQty", vs."increaseAmount",
        vs."decreaseQty", vs."decreaseAmount",
        vs."closingQty", vs."closingAmount",
        pv."productId",
        p."id" AS "productId2", p."name" AS "productName", p."code" AS "productCode",
        p."hasVariant" AS "productHasVariant",
        unit_attr."id" AS "unitId", unit_attr."name" AS "unitName",
        cat_attr."id" AS "categoryId", cat_attr."name" AS "categoryName"
      `;

      // ===== BƯỚC 6: Query chính (có phân trang) =====
      const offset = (page - 1) * size;

      // Build ORDER BY: computed fields from vs, product fields from p
      let orderClause: string;
      if (ALLOWED_SORT_FIELDS.includes(safeSortBy)) {
        if (safeSortBy === "productName" || safeSortBy === "productCode") {
          orderClause = `p."${safeSortBy === "productName" ? "name" : "code"}" ${safeSortOrder}, vs."variantId" ${safeSortOrder}`;
        } else {
          orderClause = `vs."${safeSortBy}" ${safeSortOrder}, vs."variantId" ${safeSortOrder}`;
        }
      } else {
        orderClause = `vs."closingQty" ${safeSortOrder}, vs."variantId" ${safeSortOrder}`;
      }

      const mainSql = `
        WITH ${variantStockCTE}
        SELECT ${selectColumns}
        ${joinAndWhere}
        ORDER BY ${orderClause}
        LIMIT ${size} OFFSET ${offset}
      `;

      // ===== BƯỚC 7: Summary query =====
      const summarySql = `
        WITH ${variantStockCTE}
        SELECT
          COALESCE(SUM(vs."openingQty"), 0)::float AS "openingQty",
          COALESCE(SUM(vs."openingAmount"), 0)::float AS "openingAmount",
          COALESCE(SUM(vs."increaseQty"), 0)::float AS "increaseQty",
          COALESCE(SUM(vs."increaseAmount"), 0)::float AS "increaseAmount",
          COALESCE(SUM(vs."decreaseQty"), 0)::float AS "decreaseQty",
          COALESCE(SUM(vs."decreaseAmount"), 0)::float AS "decreaseAmount",
          COALESCE(SUM(vs."closingQty"), 0)::float AS "closingQty",
          COALESCE(SUM(vs."closingAmount"), 0)::float AS "closingAmount",
          COUNT(CASE WHEN vs."closingQty" = 0 THEN 1 END)::int AS "outOfStockItems",
          COUNT(CASE WHEN vs."closingQty" > 0 AND vs."closingQty" < ${config.MINIMUM_STOCK_LEVEL} THEN 1 END)::int AS "lowStockItems",
          COUNT(CASE WHEN vs."closingQty" > ${config.MAXIMUM_STOCK_LEVEL} THEN 1 END)::int AS "overstockItems",
          COUNT(*)::int AS "totalRecords"
        ${joinAndWhere}
      `;

      // ===== BƯỚC 8: Thực thi cả 2 queries =====
      const [variantRows, summaryRows] = await Promise.all([
        manager.query(mainSql, sqlParams),
        manager.query(summarySql, sqlParams),
      ]);

      const summaryRow = summaryRows?.[0] || {};
      const totalRecords = parseInt(summaryRow.totalRecords, 10) || 0;
      const totalPages = Math.ceil(totalRecords / size);

      const summary = {
        openingQty: Number(summaryRow.openingQty) || 0,
        openingAmount: Number(summaryRow.openingAmount) || 0,
        increaseQty: Number(summaryRow.increaseQty) || 0,
        increaseAmount: Number(summaryRow.increaseAmount) || 0,
        decreaseQty: Number(summaryRow.decreaseQty) || 0,
        decreaseAmount: Number(summaryRow.decreaseAmount) || 0,
        closingQty: Number(summaryRow.closingQty) || 0,
        closingAmount: Number(summaryRow.closingAmount) || 0,
        outOfStockItems: Number(summaryRow.outOfStockItems) || 0,
        lowStockItems: Number(summaryRow.lowStockItems) || 0,
        overstockItems: Number(summaryRow.overstockItems) || 0,
      };

      if (!variantRows || variantRows.length === 0) {
        return {
          message: "No products found.",
          statusCode: 200,
          success: true,
          data: [],
          pagination: { currentPage: page, size, totalRecords, totalPages },
          summary,
        };
      }

      // ===== BƯỚC 9: Group variant rows by product =====
      const productMap = new Map<string, any>();

      for (const row of variantRows) {
        const productId = row.productId || row.productId2;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: productId,
            code: row.productCode || "",
            name: row.productName || "",
            hasVariant: row.productHasVariant ?? true,
            unit: row.unitId
              ? { id: row.unitId, name: row.unitName || "" }
              : null,
            category: row.categoryId
              ? { id: row.categoryId, name: row.categoryName || "" }
              : null,
            variants: [],
            openingQty: 0,
            openingAmount: 0,
            increaseQty: 0,
            increaseAmount: 0,
            decreaseQty: 0,
            decreaseAmount: 0,
            closingQty: 0,
            closingAmount: 0,
          });
        }

        const product = productMap.get(productId)!;
        const vOpen = Number(row.openingQty) || 0;
        const vOpenAmt = Number(row.openingAmount) || 0;
        const vInc = Number(row.increaseQty) || 0;
        const vIncAmt = Number(row.increaseAmount) || 0;
        const vDec = Number(row.decreaseQty) || 0;
        const vDecAmt = Number(row.decreaseAmount) || 0;
        const vClose = Number(row.closingQty) || 0;
        const vCloseAmt = Number(row.closingAmount) || 0;

        product.openingQty += vOpen;
        product.openingAmount += vOpenAmt;
        product.increaseQty += vInc;
        product.increaseAmount += vIncAmt;
        product.decreaseQty += vDec;
        product.decreaseAmount += vDecAmt;
        product.closingQty += vClose;
        product.closingAmount += vCloseAmt;

        product.variants.push({
          id: row.variantId,
          openingQty: vOpen,
          openingAmount: vOpenAmt,
          increaseQty: vInc,
          increaseAmount: vIncAmt,
          decreaseQty: vDec,
          decreaseAmount: vDecAmt,
          closingQty: vClose,
          closingAmount: vCloseAmt,
        });
      }

      const productsArray = Array.from(productMap.values());

      // ===== BƯỚC 10: Load variant details (options, sku, barcode) =====
      const allVariantIds = variantRows.map((r: any) => r.variantId);
      const variantsDetail = await manager
        .createQueryBuilder(ProductVariant, "v")
        .leftJoinAndSelect("v.options", "options")
        .leftJoinAndSelect("options.type", "optionType")
        .where("v.id IN (:...ids)", { ids: allVariantIds })
        .getMany();
      const variantDetailMap = new Map(variantsDetail.map((v) => [v.id, v]));

      for (const product of productsArray) {
        product.variants = product.variants.map((v: any) => {
          const detail = variantDetailMap.get(v.id);
          return {
            id: v.id,
            productId: product.id,
            options: detail?.options || [],
            sku: detail?.sku || null,
            barcode: detail?.barcode || null,
            openingQty: v.openingQty,
            openingAmount: v.openingAmount,
            increaseQty: v.increaseQty,
            increaseAmount: v.increaseAmount,
            decreaseQty: v.decreaseQty,
            decreaseAmount: v.decreaseAmount,
            closingQty: v.closingQty,
            closingAmount: v.closingAmount,
          };
        });
      }

      // ===== BƯỚC 11: Attach files =====
      const productsWithFiles =
        await FileHelper.attachFilesToEntities(productsArray);

      const allVariantsForFile = productsWithFiles.flatMap(
        (p: any) => p.variants || [],
      );
      const variantsWithFiles =
        await FileHelper.attachFilesToEntities(allVariantsForFile);
      const variantFileMap = new Map(
        variantsWithFiles.map((v: any) => [v.id, v]),
      );

      const finalProducts = productsWithFiles.map((product: any) => ({
        ...product,
        variants: (product.variants || []).map(
          (v: any) => variantFileMap.get(v.id) || v,
        ),
      }));

      return {
        message: "Stock report retrieved successfully.",
        statusCode: 200,
        success: true,
        data: finalProducts,
        pagination: {
          currentPage: page,
          size,
          totalRecords,
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
   * Tìm các phiếu chuyển kho nội bộ (cả 2 kho đều trong scope)
   * để loại trừ khỏi báo cáo tồn kho
   */
  private async findExcludedTransferIds(
    manager: EntityManager,
    storeIds: string[],
    endAt: Date,
  ): Promise<string[]> {
    if (storeIds.length === 0) return [];

    const transfers = await manager
      .createQueryBuilder(StoreTransfer, "t")
      .select("t.id")
      .where("t.occurredAt <= :endAt", { endAt })
      .andWhere("t.fromStoreId IN (:...storeIds)", { storeIds })
      .andWhere("t.toStoreId IN (:...storeIds)", { storeIds })
      .getMany();

    return transfers.map((t) => t.id);
  }

  /**
   * Empty stock report response helper
   */
  private emptyStockReportResponse(page: number, size: number): ApiResponse {
    return {
      message: "No products found.",
      statusCode: 200,
      success: true,
      data: [],
      pagination: {
        currentPage: page,
        size,
        totalRecords: 0,
        totalPages: 0,
      },
      summary: {
        openingQty: 0,
        openingAmount: 0,
        increaseQty: 0,
        increaseAmount: 0,
        decreaseQty: 0,
        decreaseAmount: 0,
        closingQty: 0,
        closingAmount: 0,
        outOfStockItems: 0,
        lowStockItems: 0,
        overstockItems: 0,
      },
    };
  }

  /**
   * Chi tiết transactions (nhập xuất tồn)
   * Có phân trang. BE tự tính closingQuantity/closingAmount
   * để FE không cần tính running balance.
   */
  async getTransactionDetails(
    params: GetTransactionDetailsQueryDto,
  ): Promise<ApiResponse<InventoryTransaction[]>> {
    const {
      productId,
      productVariantId,
      storeIds = [],
      storeId,
      startAt,
      endAt,
      page = 1,
      size = 20,
      refType,
    } = params;
    const finalStoreIds: string[] = storeId ? [storeId] : storeIds || [];
    const manager = await this.getManager();

    /* --------------------------------------------
     * 1️⃣ Resolve productVariantIds
     * -------------------------------------------- */
    let variantIds: string[] = [];

    if (productVariantId) {
      variantIds = [productVariantId];
    } else if (productId) {
      const product = await manager.findOne(Product, {
        where: { id: productId },
        relations: ["variants"],
      });
      variantIds = product?.variants?.map((v) => v.id) || [];
    }

    if (variantIds.length === 0) {
      return {
        message: "Không tìm thấy sản phẩm nào.",
        statusCode: 200,
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          size,
          totalRecords: 0,
          totalPages: 0,
        },
        summary: {
          openingQty: 0,
          openingAmount: 0,
          totalInQty: 0,
          totalInAmount: 0,
          totalOutQty: 0,
          totalOutAmount: 0,
          closingQty: 0,
          closingAmount: 0,
        },
      };
    }

    /* --------------------------------------------
     * 2️⃣ Calculate opening/closing stock via SQL
     * -------------------------------------------- */
    // Opening: SUM of last quantityAfter/inventoryValueAfter before startAt per store
    const openingQb = manager
      .createQueryBuilder()
      .select('COALESCE(SUM(last_per_store."quantityAfter"), 0)::float', "qty")
      .addSelect(
        'COALESCE(SUM(last_per_store."inventoryValueAfter"), 0)::float',
        "amount",
      )
      .from((subQb) => {
        return subQb
          .select(
            'DISTINCT ON (it."storeId") it."quantityAfter"',
            "quantityAfter",
          )
          .addSelect('it."inventoryValueAfter"', "inventoryValueAfter")
          .addSelect('it."storeId"', "storeId")
          .from(InventoryTransaction, "it")
          .where('it."productVariantId" IN (:...variantIds)', { variantIds })
          .andWhere('it."occurredAt" < :startAt', { startAt })
          .andWhere('it."deletedAt" IS NULL')
          .orderBy('it."storeId"')
          .addOrderBy('it."occurredAt"', "DESC")
          .addOrderBy('it."createdAt"', "DESC");
      }, "last_per_store");
    if (finalStoreIds.length > 0) {
      openingQb.andWhere('"last_per_store"."storeId" IN (:...finalStoreIds)', {
        finalStoreIds,
      });
    }
    const openingResult = await openingQb.getRawOne();

    const openingQty = parseFloat(openingResult?.qty || "0");
    const openingAmount = parseFloat(openingResult?.amount || "0");

    // Closing: SUM of last quantityAfter/inventoryValueAfter <= endAt per store
    const closingQb = manager
      .createQueryBuilder()
      .select('COALESCE(SUM(last_per_store."quantityAfter"), 0)::float', "qty")
      .addSelect(
        'COALESCE(SUM(last_per_store."inventoryValueAfter"), 0)::float',
        "amount",
      )
      .from((subQb) => {
        return subQb
          .select(
            'DISTINCT ON (it."storeId") it."quantityAfter"',
            "quantityAfter",
          )
          .addSelect('it."inventoryValueAfter"', "inventoryValueAfter")
          .addSelect('it."storeId"', "storeId")
          .from(InventoryTransaction, "it")
          .where('it."productVariantId" IN (:...variantIds)', { variantIds })
          .andWhere('it."occurredAt" <= :endAt', { endAt })
          .andWhere('it."deletedAt" IS NULL')
          .orderBy('it."storeId"')
          .addOrderBy('it."occurredAt"', "DESC")
          .addOrderBy('it."createdAt"', "DESC");
      }, "last_per_store");
    if (finalStoreIds.length > 0) {
      closingQb.andWhere('"last_per_store"."storeId" IN (:...finalStoreIds)', {
        finalStoreIds,
      });
    }
    const closingResult = await closingQb.getRawOne();

    const closingQty = parseFloat(closingResult?.qty || "0");
    const closingAmount = parseFloat(closingResult?.amount || "0");

    /* --------------------------------------------
     * 3️⃣ Find excluded transfer IDs
     * -------------------------------------------- */
    let excludedTransferIds: string[] = [];
    const transfersQb = manager
      .createQueryBuilder(StoreTransfer, "t")
      .where("t.occurredAt >= :startAt", { startAt })
      .andWhere("t.occurredAt <= :endAt", { endAt });

    if (finalStoreIds.length > 0) {
      transfersQb
        .andWhere("t.fromStoreId IN (:...finalStoreIds)", { finalStoreIds })
        .andWhere("t.toStoreId IN (:...finalStoreIds)", { finalStoreIds });
    }

    const transfers = await transfersQb.getMany();
    excludedTransferIds = transfers.map((t: StoreTransfer) => t.id);

    /* --------------------------------------------
     * 4️⃣ Query TẤT CẢ transactions trong kỳ
     *    (CHƯA filter refType - vì cần tính closing)
     * -------------------------------------------- */
    const txQb = manager
      .createQueryBuilder(InventoryTransaction, "tx")
      .where("tx.productVariantId IN (:...variantIds)", { variantIds })
      .andWhere("tx.occurredAt BETWEEN :startAt AND :endAt", {
        startAt,
        endAt,
      })
      .orderBy("tx.occurredAt", "ASC")
      .addOrderBy("tx.createdAt", "ASC")
      .addOrderBy("tx.id", "ASC");

    // Loại bỏ chuyển kho nội bộ
    if (excludedTransferIds.length > 0) {
      txQb.andWhere(
        "NOT (tx.refType = :transferType AND tx.refId IN (:...excludedIds))",
        {
          transferType: InventoryRefTypeEnum.TRANSFER,
          excludedIds: excludedTransferIds,
        },
      );
    }

    if (finalStoreIds.length > 0) {
      txQb.andWhere("tx.storeId IN (:...finalStoreIds)", { finalStoreIds });
    }

    const allTransactions = await txQb.getMany();

    /* --------------------------------------------
     * 5️⃣ Tính running balance trên TOÀN BỘ transactions
     *    Phải chạy TRƯỚC filter refType để closing
     *    phản ánh đúng tồn kho thực tế.
     * -------------------------------------------- */
    let runningQuantity = openingQty;
    let runningAmount = openingAmount;
    let totalInQty = 0;
    let totalInAmount = 0;
    let totalOutQty = 0;
    let totalOutAmount = 0;

    allTransactions.forEach((tx) => {
      const isIn = tx.type === InventoryTransactionTypeEnum.IN;
      runningQuantity += isIn ? tx.quantity : -tx.quantity;
      runningAmount += isIn ? tx.amount : -tx.amount;

      // Gắn closing values vào transaction object
      (tx as any).closingQty = runningQuantity;
      (tx as any).closingAmount = runningAmount;

      // Accumulate cho summary
      if (isIn) {
        totalInQty += tx.quantity;
        totalInAmount += tx.amount;
      } else {
        totalOutQty += tx.quantity;
        totalOutAmount += tx.amount;
      }
    });

    /* --------------------------------------------
     * 6️⃣ Filter by refType (SAU khi đã tính closing)
     * -------------------------------------------- */
    const filteredTransactions = refType
      ? allTransactions.filter((tx) => tx.refType === refType)
      : allTransactions;

    /* --------------------------------------------
     * 7️⃣ Paginate
     * -------------------------------------------- */
    const totalRecords = filteredTransactions.length;
    const totalPages = Math.ceil(totalRecords / size);
    const safePage = Math.min(page, totalPages) || 1;
    const offset = (safePage - 1) * size;
    const transactions = filteredTransactions.slice(offset, offset + size);

    /* --------------------------------------------
     * 8️⃣ Enrich với relations
     * -------------------------------------------- */
    await this.enrichTransactionsWithRelations(transactions);

    /* --------------------------------------------
     * 9️⃣ Return
     * -------------------------------------------- */
    return {
      message: "Lấy chi tiết giao dịch thành công.",
      statusCode: 200,
      success: true,
      data: transactions,
      pagination: {
        currentPage: safePage,
        size,
        totalRecords,
        totalPages,
      },
      summary: {
        openingQty,
        openingAmount,
        totalInQty,
        totalInAmount,
        totalOutQty,
        totalOutAmount,
        closingQty,
        closingAmount,
      },
    };
  }

  /**
   * Enrich transactions với product variant và store data
   */
  private async enrichTransactionsWithRelations(
    transactions: InventoryTransaction[],
  ): Promise<void> {
    if (transactions.length === 0) return;

    // Lấy unique IDs
    const variantIds = [
      ...new Set(transactions.map((tx) => tx.productVariantId)),
    ];
    const storeIds = [...new Set(transactions.map((tx) => tx.storeId))];

    const manager = await this.getManager();

    // Batch query variants với products
    const variants = await manager
      .createQueryBuilder(ProductVariant, "v")
      .leftJoinAndSelect("v.product", "product")
      .leftJoinAndSelect("v.options", "options")
      .leftJoinAndSelect("options.type", "optionType")
      .where("v.id IN (:...variantIds)", { variantIds })
      .getMany();

    // Batch query stores
    const stores = await manager
      .createQueryBuilder(Store, "w")
      .where("w.id IN (:...storeIds)", { storeIds })
      .getMany();

    // Map vào transactions
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const storeMap = new Map(stores.map((w) => [w.id, w]));

    transactions.forEach((tx) => {
      const variant = variantMap.get(tx.productVariantId);
      const store = storeMap.get(tx.storeId);

      (tx as any).productVariant = variant || null;
      (tx as any).product = variant?.product || null;
      (tx as any).store = store || null;
    });
  }

  /**
   * Lấy danh sách sản phẩm tồn thấp
   * Được sử dụng trong Dashboard
   */
  async getLowStockProducts(
    offsetAt: Date,
    storeId?: string,
  ): Promise<LowStockProduct[]> {
    const manager = await this.getManager();

    // ===== BƯỚC 1: Lấy tất cả product variants =====
    const variantsQb = manager
      .createQueryBuilder(ProductVariant, "pv")
      .leftJoinAndSelect("pv.product", "product")
      .leftJoinAndSelect("product.category", "category")
      .leftJoinAndSelect("pv.options", "options")
      .leftJoinAndSelect("options.type", "optionType")
      .where("pv.isActive = :isActive", { isActive: true })
      .andWhere('pv."deletedAt" IS NULL')
      .andWhere('product."deletedAt" IS NULL');

    const allVariants = await variantsQb.getMany();

    if (allVariants.length === 0) {
      return [];
    }

    const variantIds = allVariants.map((v) => v.id);

    // ===== BƯỚC 2: Tính tồn kho tại thời điểm offsetAt =====
    // Lấy quantityAfter từ transaction cuối cùng <= offsetAt cho từng variant+store, tổng hợp per variant
    const stockRows = await manager
      .createQueryBuilder()
      .select('"s"."productVariantId"', "variantId")
      .addSelect('COALESCE(SUM("s"."quantityAfter"), 0)::float', "closingQty")
      .from((subQb) => {
        const q = subQb
          .select(
            'DISTINCT ON (it."productVariantId", it."storeId") it."productVariantId"',
            "productVariantId",
          )
          .addSelect('it."quantityAfter"', "quantityAfter")
          .addSelect('it."storeId"', "storeId")
          .from(InventoryTransaction, "it")
          .where("it.productVariantId IN (:...variantIds)", { variantIds })
          .andWhere("it.occurredAt <= :offsetAt", { offsetAt })
          .andWhere("it.deletedAt IS NULL")
          .orderBy('it."productVariantId"')
          .addOrderBy('it."storeId"')
          .addOrderBy('it."occurredAt"', "DESC")
          .addOrderBy('it."createdAt"', "DESC");

        if (storeId) {
          q.andWhere("it.storeId = :storeId", { storeId });
        }

        return q;
      }, "s")
      .groupBy('"s"."productVariantId"')
      .getRawMany();

    const stockMap = new Map<string, number>(
      stockRows.map((r: any) => [r.variantId, parseFloat(r.closingQty || "0")]),
    );

    // ===== BƯỚC 3: Tính avgDailySales từ 30 ngày trước =====
    const thirtyDaysAgo = new Date(offsetAt);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Lấy các transaction OUT trong 30 ngày
    const salesTxQb = manager
      .createQueryBuilder(InventoryTransaction, "tx")
      .where("tx.productVariantId IN (:...variantIds)", { variantIds })
      .andWhere("tx.type = :type", {
        type: InventoryTransactionTypeEnum.OUT,
      })
      .andWhere("tx.refType = :refType", {
        refType: InventoryRefTypeEnum.SALE,
      })
      .andWhere("tx.occurredAt BETWEEN :startDate AND :endDate", {
        startDate: thirtyDaysAgo,
        endDate: offsetAt,
      });

    if (storeId) {
      salesTxQb.andWhere("tx.storeId = :storeId", { storeId });
    }

    const salesTransactions = await salesTxQb.getMany();

    // Group by variantId để tính tổng quantity bán ra
    const salesMap = new Map<string, number>();
    salesTransactions.forEach((tx) => {
      const current = salesMap.get(tx.productVariantId) || 0;
      salesMap.set(tx.productVariantId, current + tx.quantity);
    });

    // ===== BƯỚC 4: Lọc và build result =====
    const lowStockProducts: LowStockProduct[] = [];
    const productStockMap = new Map<
      string,
      {
        product: Product;
        currentStock: number;
        totalSold: number;
        variants: ProductVariant[];
      }
    >();

    for (const variant of allVariants) {
      if (!variant.product) {
        continue;
      }

      const currentStock = stockMap.get(variant.id) || 0;
      const totalSold = salesMap.get(variant.id) || 0;

      const productId = variant.product.id;
      if (!productStockMap.has(productId)) {
        productStockMap.set(productId, {
          product: variant.product,
          currentStock: 0,
          totalSold: 0,
          variants: [],
        });
      }

      const productData = productStockMap.get(productId)!;
      productData.currentStock += currentStock;
      productData.totalSold += totalSold;
      productData.variants.push(variant);
    }

    for (const [productId, data] of productStockMap) {
      const { product, currentStock, totalSold } = data;
      const productName = product.name?.trim();

      if (!productName) continue;

      // Chỉ lấy những sản phẩm sắp hết: tồn > 0 và < MINIMUM_STOCK_LEVEL
      if (currentStock <= 0 || currentStock >= config.MINIMUM_STOCK_LEVEL) {
        continue;
      }

      const avgDailySales = totalSold / 30; // Average per day

      // Tính số ngày sẽ hết hàng
      const daysUntilStockout =
        avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : 999;

      // Đề xuất số lượng nên đặt hàng (đủ cho 30 ngày)
      const reorderRecommendation = Math.max(
        0,
        Math.ceil(avgDailySales * 30 - currentStock),
      );

      lowStockProducts.push({
        id: product.id,
        name: productName,
        code: product.code || "",
        categoryName: product.category?.name || "",
        currentStock,
        minimumStock: config.MINIMUM_STOCK_LEVEL,
        avgDailySales: parseFloat(avgDailySales.toFixed(2)),
        daysUntilStockout,
        reorderRecommendation,
      });
    }

    // Sort theo currentStock tăng dần (ưu tiên sản phẩm sắp hết nhất)
    lowStockProducts.sort((a, b) => a.currentStock - b.currentStock);

    // ===== BƯỚC 5: Attach files =====
    const productsWithFiles = (await FileHelper.attachFilesToEntities(
      lowStockProducts as any,
    )) as LowStockProduct[];

    return productsWithFiles;
  }

  /**
   * Enrich variants với stock data
   * Gọi sau khi load products để tính tồn cho từng variant
   */
  async enrichVariantsWithStock(
    products: Product[],
    storeId?: string,
  ): Promise<Product[]> {
    try {
      if (!products.length) return products;

      const variantIds: string[] = [];
      products.forEach((p) =>
        p.variants?.forEach((v) => variantIds.push(v.id)),
      );
      if (!variantIds.length) return products;

      const manager = await this.getManager();

      // 🔑 build join condition
      let joinCondition =
        'st."productVariantId" = pv.id AND st."quantityRemaining" > 0';

      if (storeId) {
        joinCondition += ' AND st."storeId" = :storeId';
      }

      const qb = manager
        .createQueryBuilder(ProductVariant, "pv")
        .select("pv.id", "variantId")
        .addSelect("COALESCE(SUM(st.quantityRemaining), 0)", "stockQty")
        .addSelect(
          "COALESCE(SUM(st.quantityRemaining * st.unitCost), 0)",
          "stockValue",
        )
        .leftJoin("stock_trackings", "st", joinCondition)
        .where("pv.id IN (:...variantIds)", { variantIds });

      if (storeId) {
        qb.setParameter("storeId", storeId);
      }

      const stockData = await qb.groupBy("pv.id").getRawMany();

      // Map stock data vào variants
      const stockMap = new Map<string, VariantStockData>(
        stockData.map((item: any) => [
          item.variantId,
          {
            stockQty: parseFloat(item.stockQty) || 0,
            stockValue: parseFloat(item.stockValue) || 0,
          },
        ]),
      );

      // Enrich variants
      products.forEach((product) => {
        let totalStockQty = 0;
        let totalStockValue = 0;
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant) => {
            const stock: VariantStockData = stockMap.get(variant.id) || {
              stockQty: 0,
              stockValue: 0,
            };
            (variant as any).stockQty = stock.stockQty;
            (variant as any).stockValue = stock.stockValue;
            totalStockQty += stock.stockQty;
            totalStockValue += stock.stockValue;
          });
        }
        (product as any).totalStockQty = totalStockQty;
        (product as any).totalStockValue = totalStockValue;
      });

      return products;
    } catch (error) {
      console.error("Error enriching variants with stock:", error);
      return products;
    }
  }
}
