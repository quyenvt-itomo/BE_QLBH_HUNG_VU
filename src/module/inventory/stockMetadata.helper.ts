import { injectable } from "inversify";
import { EntityManager } from "typeorm";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { Product } from "@/database/models/Product";
import { TransactionType } from "@/shared/constants/enum";

@injectable()
export class StockMetadataHelper {
  async updateStockMetadata(productId: string, manager: EntityManager): Promise<void> {
    const rows = await manager.getRepository(InventoryTransaction)
      .createQueryBuilder("tx")
      .select('DISTINCT ON (tx."storeId") tx."storeId"', "storeId")
      .addSelect('tx."quantityAfter"', "quantity")
      .addSelect('tx."inventoryValueAfter"', "value")
      .where('tx."productId" = :productId', { productId })
      .andWhere('tx."deletedAt" IS NULL')
      .orderBy('tx."storeId"', "ASC")
      .addOrderBy('tx."occurredAt"', "DESC")
      .addOrderBy('tx."createdAt"', "DESC")
      .addOrderBy('tx."id"', "DESC")
      .getRawMany<{ storeId: string; quantity: string; value: string }>();
    const byStore: Record<string, { qty: number; value: number }> = {};
    let qty = 0; let value = 0;
    for (const row of rows) {
      const item = { qty: Number(row.quantity) || 0, value: Number(row.value) || 0 };
      byStore[row.storeId] = item; qty += item.qty; value += item.value;
    }
    await manager.getRepository(Product).update(productId, { stockMetadata: { total: { qty, value }, byStore } });
  }
  async updateStockMetadataForPair(productId: string, _storeId: string, manager: EntityManager): Promise<void> { await this.updateStockMetadata(productId, manager); }
  async batchUpdateStockMetadata(productIds: string[], manager: EntityManager): Promise<void> { for (const id of productIds) await this.updateStockMetadata(id, manager); }
  async batchUpdateCascadeToProducts(productIds: string[], manager: EntityManager): Promise<void> { return this.batchUpdateStockMetadata(productIds, manager); }
}
