import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Product } from "@/database/models/Product";
import { ProductSelectFull, ProductRelations } from "./product.select";
import { inject, injectable } from "inversify";
import {
  PRODUCT_VARIANT_TYPES,
  ProductVariantRepository,
  ProductVariantSnapshot,
} from "./productVariant";
import { ATTRIBUTE_TYPES, AttributeRepository } from "../attribute";
import { EntityManager, SelectQueryBuilder } from "typeorm";
import { OPERATOR_MAP, RangeSuffix } from "@/shared/types/interfaces";

/**
 * Product Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class ProductRepository extends BaseRepository<Product> {
  protected entityClass = Product;
  protected selectedFields = ProductSelectFull;
  protected relations = ProductRelations;
  protected enableFileAttachment = true;
  protected multipleFile = true;
  protected nestedFileFields: string[] = ["variants"];

  constructor(
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRepository)
    protected productVariantRepository: ProductVariantRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    protected attributeRepository: AttributeRepository,
  ) {
    super();
  }

  /**
   * Helper để tạo EXISTS query filter theo variant field
   */
  private buildVariantFieldFilter(
    qb: SelectQueryBuilder<Product>,
    fieldName: "price" | "costPrice",
    operator: ">=" | ">" | "<=" | "<" | "=",
    value: number,
    paramName: string,
  ): string {
    return `EXISTS (
      SELECT 1
      FROM product_variants pv
      WHERE pv."productId" = ${qb.alias}.id 
        AND pv."deletedAt" IS NULL
        AND pv."${fieldName}" ${operator} :${paramName}
    )`;
  }

  private applyVariantFieldFilters(
    qb: SelectQueryBuilder<Product>,
    fieldName: "price" | "costPrice",
    filters: Record<RangeSuffix, number | undefined | null>,
  ) {
    for (const [key, value] of Object.entries(filters)) {
      if (value == null) continue;

      const operator = OPERATOR_MAP[key as RangeSuffix];
      if (!operator) continue; // Skip nếu key không hợp lệ

      const paramName = `${fieldName}_${key}`;

      qb.andWhere(
        this.buildVariantFieldFilter(qb, fieldName, operator, value, paramName),
        { [paramName]: value },
      );
    }
  }

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Product>,
    options: IFindPaginationOptions<Product>,
  ): Promise<void> {
    await super.extendQueryBuilder?.(qb, options);

    const {
      productCategoryIds,
      unitIds,
      storeId,
      sortBy,
      sortOrder,

      costPriceGte,
      costPriceGt,
      costPriceLte,
      costPriceLt,
      costPriceEq,

      priceGte,
      priceGt,
      priceLte,
      priceLt,
      priceEq,

      totalStockQtyGte,
      totalStockQtyGt,
      totalStockQtyLte,
      totalStockQtyLt,
      totalStockQtyEq,

      totalStockValueGte,
      totalStockValueGt,
      totalStockValueLte,
      totalStockValueLt,
      totalStockValueEq,
    } = options?.moreQuery || {};

    // ===== Thêm computed fields cho stock từ stock_trackings =====

    // =========================================================================
    // 🚀 STOCK CALCULATION - JSONB DENORMALIZED APPROACH (High Performance)
    // =========================================================================
    // ✅ NEW: Direct access to products.stockMetadata (no subquery, no JOIN)
    // ⚡ Performance: O(1) direct field access on same table
    // 🎯 Benefits:
    //    - Ultra-fast: No subquery, no JOIN, direct column access
    //    - Simple filters/sorts: Use PostgreSQL native JSONB operators
    //    - JSONB indexing: Can create GIN index for even faster access
    // ⚠️ Trade-off: Must keep products.stockMetadata in sync via cascade updates
    // =========================================================================

    // Build expressions based on store filter
    let totalStockQtyExpr: string;
    let totalStockValueExpr: string;

    if (storeId) {
      // Specific store: Direct access to products.stockMetadata.byStore[storeId]
      totalStockQtyExpr = `
        COALESCE(
          (${qb.alias}."stockMetadata"->'byStore'->:storeId->>'quantity')::float,
          0
        )
      `;

      totalStockValueExpr = `
        COALESCE(
          (${qb.alias}."stockMetadata"->'byStore'->:storeId->>'value')::float,
          0
        )
      `;

      qb.setParameter("storeId", storeId);
    } else {
      // All stores: Direct access to products.stockMetadata.total
      totalStockQtyExpr = `
        COALESCE(
          (${qb.alias}."stockMetadata"->'total'->>'quantity')::float,
          0
        )
      `;

      totalStockValueExpr = `
        COALESCE(
          (${qb.alias}."stockMetadata"->'total'->>'value')::float,
          0
        )
      `;
    }

    // totalStockQty: Tổng số lượng tồn kho của product (sum các variants)
    qb.addSelect(`${totalStockQtyExpr}::float8`, "entity_totalstockquantity");

    // totalStockValue: Tổng giá trị tồn kho của product
    qb.addSelect(`${totalStockValueExpr}::float8`, "entity_totalstockvalue");

    // ===== Filter theo totalStockQty =====
    if (totalStockQtyGte != null) {
      qb.andWhere(`${totalStockQtyExpr} >= :totalStockQtyGte`, {
        totalStockQtyGte,
      });
    }
    if (totalStockQtyGt != null) {
      qb.andWhere(`${totalStockQtyExpr} > :totalStockQtyGt`, {
        totalStockQtyGt,
      });
    }
    if (totalStockQtyLte != null) {
      qb.andWhere(`${totalStockQtyExpr} <= :totalStockQtyLte`, {
        totalStockQtyLte,
      });
    }
    if (totalStockQtyLt != null) {
      qb.andWhere(`${totalStockQtyExpr} < :totalStockQtyLt`, {
        totalStockQtyLt,
      });
    }
    if (totalStockQtyEq != null) {
      qb.andWhere(`${totalStockQtyExpr} = :totalStockQtyEq`, {
        totalStockQtyEq,
      });
    }

    // ===== Filter theo totalStockValue =====
    if (totalStockValueGte != null) {
      qb.andWhere(`${totalStockValueExpr} >= :totalStockValueGte`, {
        totalStockValueGte,
      });
    }
    if (totalStockValueGt != null) {
      qb.andWhere(`${totalStockValueExpr} > :totalStockValueGt`, {
        totalStockValueGt,
      });
    }
    if (totalStockValueLte != null) {
      qb.andWhere(`${totalStockValueExpr} <= :totalStockValueLte`, {
        totalStockValueLte,
      });
    }
    if (totalStockValueLt != null) {
      qb.andWhere(`${totalStockValueExpr} < :totalStockValueLt`, {
        totalStockValueLt,
      });
    }
    if (totalStockValueEq != null) {
      qb.andWhere(`${totalStockValueExpr} = :totalStockValueEq`, {
        totalStockValueEq,
      });
    }

    // ===== Filter theo giá vốn (costPrice) =====
    this.applyVariantFieldFilters(qb, "costPrice", {
      Gte: costPriceGte,
      Gt: costPriceGt,
      Lte: costPriceLte,
      Lt: costPriceLt,
      Eq: costPriceEq,
    });

    // ===== Filter theo giá bán (price) =====
    this.applyVariantFieldFilters(qb, "price", {
      Gte: priceGte,
      Gt: priceGt,
      Lte: priceLte,
      Lt: priceLt,
      Eq: priceEq,
    });

    // category filter
    if (this.checkArrayFilter(productCategoryIds)) {
      const categoryFamilyIds =
        await this.attributeRepository.collectProductCategoryFamilyIds(
          productCategoryIds,
        );

      qb.andWhere(`${qb.alias}.categoryId IN (:...productCategoryIds)`, {
        productCategoryIds: categoryFamilyIds,
      });
    }

    // unit filter
    if (this.checkArrayFilter(unitIds)) {
      qb.andWhere(`${qb.alias}.unitId IN (:...unitIds)`, {
        unitIds,
      });
    }

    // ===== Xử lý sắp xếp =====
    if (sortBy && sortOrder) {
      if (sortBy === "totalStockQty") {
        qb.orderBy("entity_totalstockquantity", sortOrder);
      } else if (sortBy === "totalStockValue") {
        qb.orderBy("entity_totalstockvalue", sortOrder);
      }
    }
  }

  /**
   * Tính tồn cho một variant của product
   * @param variantId
   * @param storeId
   * @returns
   */
  async calculateVariantStock(
    variantId: string,
    storeId?: string,
  ): Promise<{
    stockQty: number;
    stockValue: number;
  }> {
    const qb = await this.productVariantRepository.createQueryBuilder("pv");
    const storeConditionIt = storeId ? `AND it."storeId" = '${storeId}'` : "";
    const storeConditionIt2 = storeId ? `AND it2."storeId" = '${storeId}'` : "";
    qb.select(
      `COALESCE((
        SELECT SUM(CASE WHEN it.type = 'in' THEN it.quantity ELSE -it.quantity END)
        FROM inventory_transactions it
        WHERE it."productVariantId" = pv.id
          AND it."deletedAt" IS NULL
          ${storeConditionIt}
      ), 0)`,
      "stockQty",
    )
      .addSelect(
        `COALESCE((
          SELECT it2."inventoryValueAfter"
          FROM inventory_transactions it2
          WHERE it2."productVariantId" = pv.id
            AND it2."deletedAt" IS NULL
            ${storeConditionIt2}
          ORDER BY it2."occurredAt" DESC, it2."createdAt" DESC
          LIMIT 1
        ), 0)`,
        "stockValue",
      )
      .where("pv.id = :variantId", { variantId });

    const result = await qb.getRawOne<{
      stockQty: string;
      stockValue: string;
    }>();

    return {
      stockQty: parseFloat(result?.stockQty || "0"),
      stockValue: parseFloat(result?.stockValue || "0"),
    };
  }

  /**
   *  Lấy snapshot của product variant
   * @param variantId
   * @returns
   */
  async getProductVariantSnapshot(
    variantId: string,
  ): Promise<ProductVariantSnapshot | null> {
    const variant = await this.productVariantRepository.findOne({
      where: { id: variantId },
      relations: {
        options: { type: true },
        product: { category: true, unit: true },
      },
    });

    if (!variant) return null;

    const { product, options } = variant;

    return {
      id: variant.id,

      productId: variant.productId,
      product: {
        id: product?.id,
        name: product?.name,
        code: product?.code,
        hasVariant: product?.hasVariant,
        category: {
          id: product?.category?.id,
          name: product?.category?.name,
        },
        unit: {
          id: product?.unit?.id,
          name: product?.unit?.name,
        },
      },

      sku: variant.sku!,
      barcode: variant.barcode!,
      costPrice: variant.costPrice,
      price: variant.price,

      options: options?.map((opt) => ({
        type: {
          id: opt.type.id,
          name: opt.type.name,
        },
        value: opt.value,
        typeIndex: opt.typeIndex,
      })),

      isActive: variant.isActive,
    };
  }

  async checkActiveProductVariant(variantId: string): Promise<boolean> {
    const variant = await this.productVariantRepository.findById(variantId);

    return !!variant?.isActive;
  }

  /**
   * 🚀 Cập nhật stockMetadata cho Product (tổng từ variants active)
   * Aggregates stock data from active variants into denormalized JSONB
   *
   * @param productId - ID của product
   * @param manager - EntityManager (optional, dùng trong transaction)
   */
  async updateProductStockMetadata(
    productId: string,
    manager: EntityManager,
  ): Promise<void> {
    // Tổng hợp từ stockMetadata của các variants ACTIVE
    const result = await manager.query(
      `
      SELECT 
        pv."stockMetadata"->'byStore' as by_store_data,
        pv."stockMetadata"->'total'->>'quantity' as total_quantity,
        pv."stockMetadata"->'total'->>'value' as total_value
      FROM product_variants pv
      WHERE pv."productId" = $1
        AND pv."deletedAt" IS NULL
    `,
      [productId],
    );

    // Build metadata structure
    const byStore: Record<string, { quantity: number; value: number }> = {};
    let totalQty = 0;
    let totalValue = 0;

    result.forEach((row: any) => {
      const variantTotalQty = parseFloat(row.total_quantity) || 0;
      const variantTotalValue = parseFloat(row.total_value) || 0;

      totalQty += variantTotalQty;
      totalValue += variantTotalValue;

      // Merge byStore data
      if (row.by_store_data) {
        const byStoreData = row.by_store_data;
        for (const [storeId, storeData] of Object.entries(byStoreData)) {
          const data = storeData as { quantity: number; value: number };
          if (!byStore[storeId]) {
            byStore[storeId] = { quantity: 0, value: 0 };
          }
          byStore[storeId].quantity += data.quantity || 0;
          byStore[storeId].value += data.value || 0;
        }
      }
    });

    const stockMetadata = {
      total: { quantity: totalQty, value: totalValue },
      byStore,
    };

    // Update product with new metadata
    await manager.query(
      `
      UPDATE products
      SET "stockMetadata" = $1
      WHERE id = $2
    `,
      [JSON.stringify(stockMetadata), productId],
    );

    // logger.info(
    //   `[ProductRepository] Đã cập nhật stockMetadata cho product ${productId.substring(0, 8)}... ` +
    //     `(totalQty: ${totalQty}, totalValue: ${totalValue.toFixed(2)})`,
    // );
  }

  /**
   * 🔄 Batch update stockMetadata cho nhiều products
   * More efficient for bulk operations
   *
   * @param productIds - Array IDs của products
   * @param manager - EntityManager (optional, dùng trong transaction)
   */
  async batchUpdateProductStockMetadata(
    productIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    if (!productIds.length) return;

    // logger.info(
    //   `[ProductRepository] Bắt đầu batch update stockMetadata cho ${productIds.length} product(s)...`,
    // );

    // Update sequentially to avoid complexity
    for (const productId of productIds) {
      await this.updateProductStockMetadata(productId, manager);
    }

    // logger.info(
    //   `[ProductRepository] ✅ Hoàn thành batch update stockMetadata cho ${productIds.length} product(s)`,
    // );
  }
}
