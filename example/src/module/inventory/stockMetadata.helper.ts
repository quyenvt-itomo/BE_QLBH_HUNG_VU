import { inject, injectable } from "inversify";
import { EntityManager } from "typeorm";
import logger from "@/shared/utils/logger";
import { TransactionTypeEnum } from "@/shared/constants/enum";

/**
 * StockMetadata Helper
 * Cập nhật stockMetadata cho Product sau mỗi lần thay đổi inventory
 */
@injectable()
export class StockMetadataHelper {
  /**
   * Cập nhật stockMetadata cho 1 product
   * Tính toán từ inventory_transactions
   */
  async updateStockMetadata(
    productId: string,
    manager: EntityManager,
  ): Promise<void> {
    try {
      // Tính tổng quantity và value từ inventory_transactions
      const result = await manager
        .createQueryBuilder()
        .select('it."warehouseId"', "warehouseId")
        .addSelect(
          `SUM(CASE WHEN it.type = ${TransactionTypeEnum.IN} THEN it.quantity ELSE -it.quantity END)`,
          "qty",
        )
        .addSelect(
          `SUM(CASE WHEN it.type = ${TransactionTypeEnum.IN} THEN it.amount ELSE -it.amount END)`,
          "value",
        )
        .from("inventory_transactions", "it")
        .where('it."productId" = :productId', { productId })
        .andWhere('it."deletedAt" IS NULL')
        .groupBy('it."warehouseId"')
        .getRawMany<{ warehouseId: string; qty: string; value: string }>();

      const byWarehouse: Record<string, { qty: number; value: number }> = {};
      let totalQty = 0;
      let totalValue = 0;

      for (const row of result) {
        const qty = parseFloat(row.qty) || 0;
        const value = parseFloat(row.value) || 0;
        byWarehouse[row.warehouseId] = { qty, value };
        totalQty += qty;
        totalValue += value;
      }

      const stockMetadata = {
        total: { qty: totalQty, value: totalValue },
        byWarehouse,
        lastCalculatedAt: new Date().toISOString(),
      };

      await manager.query(
        `UPDATE products SET "stockMetadata" = $1 WHERE id = $2`,
        [JSON.stringify(stockMetadata), productId],
      );
    } catch (error: any) {
      logger.error(
        `[StockMetadataHelper] Failed to update stockMetadata for product ${productId}: ${error.message}`,
      );
    }
  }

  /**
   * Cập nhật stockMetadata cho 1 cặp (productId, warehouseId)
   */
  async updateStockMetadataForPair(
    productId: string,
    warehouseId: string,
    manager: EntityManager,
  ): Promise<void> {
    try {
      const product = await manager
        .createQueryBuilder()
        .select('"stockMetadata"')
        .from("products", "p")
        .where("p.id = :productId", { productId })
        .getRawOne<{ stockMetadata: any }>();

      if (!product) return;

      const currentMetadata =
        typeof product.stockMetadata === "string"
          ? JSON.parse(product.stockMetadata)
          : product.stockMetadata || {
              total: { qty: 0, value: 0 },
              byWarehouse: {},
            };

      // Tính cho warehouse cụ thể
      const pairResult = await manager
        .createQueryBuilder()
        .select(
          `SUM(CASE WHEN it.type = :inTransactionType THEN it.quantity ELSE -it.quantity END)`,
          "qty",
        )
        .addSelect(
          `SUM(CASE WHEN it.type = :inTransactionType THEN it.amount ELSE -it.amount END)`,
          "value",
        )
        .from("inventory_transactions", "it")
        .where('it."productId" = :productId')
        .andWhere('it."warehouseId" = :warehouseId')
        .andWhere('it."deletedAt" IS NULL')
        .setParameters({
          inTransactionType: TransactionTypeEnum.IN,
          productId,
          warehouseId,
        })
        .getRawOne<{ qty: string; value: string }>();

      const qty = parseFloat(pairResult?.qty || "0");
      const value = parseFloat(pairResult?.value || "0");

      currentMetadata.byWarehouse[warehouseId] = { qty, value };

      // Recompute total
      let totalQty = 0;
      let totalValue = 0;
      for (const [, data] of Object.entries(currentMetadata.byWarehouse)) {
        const d = data as { qty: number; value: number };
        totalQty += d.qty;
        totalValue += d.value;
      }
      currentMetadata.total = { qty: totalQty, value: totalValue };
      currentMetadata.lastCalculatedAt = new Date().toISOString();

      await manager.query(
        `UPDATE products SET "stockMetadata" = $1 WHERE id = $2`,
        [JSON.stringify(currentMetadata), productId],
      );
    } catch (error: any) {
      logger.error(
        `[StockMetadataHelper] Failed to update stockMetadata for pair (${productId}, ${warehouseId}): ${error.message}`,
      );
    }
  }

  /**
   * Batch update stockMetadata cho nhiều products
   */
  async batchUpdateStockMetadata(
    productIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    for (const productId of productIds) {
      await this.updateStockMetadata(productId, manager);
    }
  }
}
