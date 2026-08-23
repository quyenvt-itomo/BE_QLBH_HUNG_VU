import { injectable } from "inversify";
import { IsNull, EntityManager } from "typeorm";
import { TransactionService } from "@/shared/base/TransactionService";
import { ApiResponse } from "@/shared/types/interfaces";
import { InventoryTransaction, InventoryRefType } from "@/database/models/store/InventoryTransaction";
import { Product } from "@/database/models/Product";
import { TransactionType } from "@/shared/constants/enum";
import { GetStockReportQueryDto, GetTransactionDetailsQueryDto } from "./inventory.validator";

@injectable()
export class InventoryService extends TransactionService {
  async getStockReport(params: GetStockReportQueryDto): Promise<ApiResponse> {
    const manager = await this.getManager();
    const startAt = params.startAt ? new Date(params.startAt) : new Date(0);
    const endAt = params.endAt ? new Date(params.endAt) : new Date();
    const productQb = manager.getRepository(Product).createQueryBuilder("p").where("p.deletedAt IS NULL");
    if (params.productIds?.length) productQb.andWhere("p.id IN (:...productIds)", { productIds: params.productIds });
    if (params.keyword) productQb.andWhere("(p.code ILIKE :keyword OR p.name ILIKE :keyword)", { keyword: `%${params.keyword}%` });
    const products = await productQb.getMany();
    const transactions = await manager.getRepository(InventoryTransaction).find({ where: { deletedAt: IsNull() } as any, order: { occurredAt: "ASC", createdAt: "ASC" } as any });
    const requestedStores = params.storeIds?.length ? new Set(params.storeIds) : params.storeId ? new Set([params.storeId]) : undefined;
    const data = products.flatMap((product) => {
      const productTransactions = transactions.filter((tx) => tx.productId === product.id && tx.occurredAt <= endAt && (!requestedStores || requestedStores.has(tx.storeId)));
      const stores = [...new Set(productTransactions.map((tx) => tx.storeId))];
      return stores.map((storeId) => {
      const rows = productTransactions.filter((tx) => tx.storeId === storeId);
      const opening = rows.filter((tx) => tx.occurredAt < startAt).at(-1);
      const period = rows.filter((tx) => tx.occurredAt >= startAt && tx.occurredAt <= endAt);
      const incoming = period.filter((tx) => tx.type === TransactionType.IN && tx.refType !== InventoryRefType.PRODUCT_PRICE_UPDATE);
      const outgoing = period.filter((tx) => tx.type === TransactionType.OUT && tx.refType !== InventoryRefType.PRODUCT_PRICE_UPDATE);
      const priceChanges = period.filter((tx) => tx.refType === InventoryRefType.PRODUCT_PRICE_UPDATE);
      return { ...product, storeId, openingQuantity: Number(opening?.quantityAfter) || 0, openingAmount: Number(opening?.inventoryValueAfter) || 0, inQuantity: incoming.reduce((s, tx) => s + Math.abs(Number(tx.quantity) || 0), 0), inAmount: incoming.reduce((s, tx) => s + (Number(tx.amount) || 0), 0), outQuantity: outgoing.reduce((s, tx) => s + Math.abs(Number(tx.quantity) || 0), 0), outAmount: outgoing.reduce((s, tx) => s + (Number(tx.amount) || 0), 0), priceAdjustmentAmount: priceChanges.reduce((s, tx) => s + (Number(tx.amount) || 0) * (tx.type === TransactionType.IN ? 1 : -1), 0), closingQuantity: Number(rows.at(-1)?.quantityAfter) || 0, closingAmount: Number(rows.at(-1)?.inventoryValueAfter) || 0 };
      });
    });
    return { statusCode: 200, success: true, message: "OK", data, pagination: { currentPage: params.page || 1, size: params.size || data.length, totalRecords: data.length, totalPages: 1 } };
  }

  async getTransactionDetails(params: GetTransactionDetailsQueryDto): Promise<ApiResponse<InventoryTransaction[]>> {
    const manager = await this.getManager();
    const rows = await manager.getRepository(InventoryTransaction).find({ where: { productId: params.productId, ...(params.storeId ? { storeId: params.storeId } : {}), deletedAt: IsNull() } as any, order: { occurredAt: "ASC", createdAt: "ASC" } as any });
    const filtered = rows.filter((tx) => (!params.startAt || tx.occurredAt >= new Date(params.startAt)) && (!params.endAt || tx.occurredAt <= new Date(params.endAt)) && (!params.refType || tx.refType === params.refType));
    return { statusCode: 200, success: true, message: "OK", data: filtered.slice(((params.page || 1) - 1) * (params.size || 20), (params.page || 1) * (params.size || 20)), pagination: { currentPage: params.page || 1, size: params.size || 20, totalRecords: filtered.length, totalPages: Math.ceil(filtered.length / (params.size || 20)) } };
  }
}
