import { inject, injectable } from "inversify";
import { EntityManager, IsNull, LessThan } from "typeorm";
import { TransactionService } from "@/shared/base/TransactionService";
import { TransactionType } from "@/shared/constants/enum";
import { Order, OrderStatus, OrderType } from "@/database/models/store/Order";
import { OrderLine } from "@/database/models/store/OrderLine";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { InventoryTransaction, InventoryRefType } from "@/database/models/store/InventoryTransaction";
import { ProductPriceHistory } from "@/database/models/store/ProductPriceHistory";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { Product } from "@/database/models/Product";
import { StoreProduct } from "@/database/models/store/StoreProduct";
import { INVENTORY_TYPES } from "./inventory.types";
import { StockMetadataHelper } from "./stockMetadata.helper";

export interface InventoryRecalculateNode {
  productId: string;
  storeId: string;
  fromDate: Date | string;
}

type State = { quantity: number; value: number; cost: number };
type SourceEvent = {
  occurredAt: Date;
  order?: Order;
  adjustment?: InventoryAdjustment;
  transfer?: StoreTransfer;
  price?: ProductPriceHistory;
  sign?: 1 | -1;
  refType: InventoryRefType;
  refId: string;
  refCode?: string | null;
  quantity: number;
};

/**
 * Rebuilds the store/product ledger.  Every replayed row is a running state:
 * `inventoryValueAfter` is always exactly `costPriceAfter * quantityAfter`.
 * A price history is a value-only transaction (quantity = 0), so changing a
 * cost never gets mistaken for a stock movement.
 */
@injectable()
export class InventoryRecalculateService extends TransactionService {
  constructor(
    @inject(INVENTORY_TYPES.StockMetadataHelper)
    private readonly stockMetadata: StockMetadataHelper,
  ) {
    super();
  }

  private async managerOf(manager?: EntityManager): Promise<EntityManager> {
    return manager || this.getManager();
  }

  private isReturn(type: OrderType): boolean {
    return type === OrderType.PURCHASE_RETURN || type === OrderType.SALE_RETURN;
  }

  private orderSign(type: OrderType): 1 | -1 {
    return type === OrderType.PURCHASE || type === OrderType.SALE_RETURN ? 1 : -1;
  }

  private async costAt(productId: string, storeId: string, at: Date, manager: EntityManager): Promise<number> {
    const history = await manager.getRepository(ProductPriceHistory).findOne({
      where: { productId, storeId, createdAt: LessThan(at), deletedAt: IsNull() } as any,
      order: { createdAt: "DESC", id: "DESC" } as any,
    });
    if (history) return Number(history.costPrice) || 0;
    const storeProduct = await manager.getRepository(StoreProduct).findOne({ where: { productId, storeId } as any });
    return Number(storeProduct?.costPrice) || 0;
  }

  private async loadEvents(productId: string, storeId: string, fromDate: Date, manager: EntityManager): Promise<SourceEvent[]> {
    const [orders, adjustments, transfers, prices] = await Promise.all([
      manager.getRepository(Order).find({ where: { storeId, status: OrderStatus.COMPLETED, deletedAt: IsNull() } as any, relations: { lines: true, returnLines: true } }),
      manager.getRepository(InventoryAdjustment).find({ where: { storeId, deletedAt: IsNull() } as any, relations: { lines: true } }),
      manager.getRepository(StoreTransfer).find({ where: { deletedAt: IsNull() } as any, relations: { lines: true } }),
      manager.getRepository(ProductPriceHistory).find({ where: { storeId, productId, deletedAt: IsNull() } as any }),
    ]);
    const events: SourceEvent[] = [];

    for (const order of orders) {
      const at = order.occurredAt || order.orderAt;
      if (!at || at < fromDate) continue;
      const lines = [...(order.lines || []), ...(order.returnLines || [])].filter((line) => line.productId === productId && !line.deletedAt);
      for (const line of lines) {
        const quantity = Math.abs(Number(line.quantity) || 0) * (Number(line.conversionRateAtTime) || 1);
        if (!quantity) continue;
        events.push({ occurredAt: at, order, sign: this.orderSign(order.type), refType: this.orderRefType(order.type), refId: order.id, refCode: order.code, quantity });
      }
    }
    for (const adjustment of adjustments) {
      if (adjustment.occurredAt < fromDate) continue;
      for (const line of adjustment.lines || []) {
        if (line.productId !== productId || !line.adjustmentQuantity) continue;
        const quantity = Math.abs(Number(line.adjustmentQuantity) || 0);
        events.push({ occurredAt: adjustment.occurredAt, adjustment, sign: Number(line.adjustmentQuantity) >= 0 ? 1 : -1, refType: InventoryRefType.ADJUST, refId: adjustment.id, refCode: adjustment.code, quantity });
      }
    }
    for (const transfer of transfers) {
      if (transfer.occurredAt < fromDate) continue;
      for (const line of transfer.lines || []) {
        if (line.productId !== productId || !line.quantity) continue;
        const quantity = Math.abs(Number(line.quantity) || 0) * (Number(line.conversionRateAtTime) || 1);
        const isFrom = transfer.fromStoreId === storeId;
        const isTo = transfer.toStoreId === storeId;
        if (!isFrom && !isTo) continue;
        events.push({ occurredAt: transfer.occurredAt, transfer, sign: isTo ? 1 : -1, refType: InventoryRefType.TRANSFER, refId: transfer.id, refCode: transfer.code, quantity });
      }
    }
    for (const price of prices) {
      const at = price.createdAt;
      if (at >= fromDate) {
        events.push({ occurredAt: at, price, refType: InventoryRefType.PRODUCT_PRICE_UPDATE, refId: price.id, refCode: price.code, quantity: 0 });
      }
    }
    return events.sort((a, b) =>
      a.occurredAt.getTime() - b.occurredAt.getTime()
      || Number(!!b.price) - Number(!!a.price)
      || a.refId.localeCompare(b.refId),
    );
  }

  private orderRefType(type: OrderType): InventoryRefType {
    switch (type) {
      case OrderType.PURCHASE: return InventoryRefType.PURCHASE;
      case OrderType.SALE: return InventoryRefType.SALE;
      case OrderType.PURCHASE_RETURN: return InventoryRefType.PURCHASE_RETURN;
      default: return InventoryRefType.SALE_RETURN;
    }
  }

  private async previousState(productId: string, storeId: string, fromDate: Date, manager: EntityManager): Promise<State> {
    const previous = await manager.getRepository(InventoryTransaction).findOne({
      where: { productId, storeId, occurredAt: LessThan(fromDate), deletedAt: IsNull() } as any,
      order: { occurredAt: "DESC", createdAt: "DESC", id: "DESC" } as any,
    });
    if (previous) return { quantity: Number(previous.quantityAfter) || 0, value: Number(previous.inventoryValueAfter) || 0, cost: Number(previous.costPriceAfter) || 0 };
    return { quantity: 0, value: 0, cost: await this.costAt(productId, storeId, fromDate, manager) };
  }

  private async syncOrderCosts(orderIds: string[], manager: EntityManager): Promise<void> {
    for (const orderId of [...new Set(orderIds)]) {
      const order = await manager.getRepository(Order).findOne({ where: { id: orderId }, relations: { lines: true, returnLines: true } });
      if (!order) continue;
      for (const line of [...(order.lines || []), ...(order.returnLines || [])]) {
        if (!line.productId) continue;
        const tx = await manager.getRepository(InventoryTransaction).findOne({ where: { refId: order.id, productId: line.productId, storeId: order.storeId } as any, order: { occurredAt: "DESC", createdAt: "DESC" } as any });
        if (!tx) continue;
        const quantity = Math.abs(Number(line.quantity) || 0) * (Number(line.conversionRateAtTime) || 1);
        await manager.getRepository(OrderLine).update(line.id, { costPriceAtTime: Number(tx.costPriceAfter) || 0, totalCost: quantity * (Number(tx.costPriceAfter) || 0) } as any);
      }
      const lines = await manager.getRepository(OrderLine).find({ where: [{ orderId: order.id }, { returnOrderId: order.id }] as any });
      const totalCost = lines.reduce((sum, line) => sum + (Number(line.totalCost) || 0), 0);
      await manager.getRepository(Order).update(order.id, this.isReturn(order.type) ? { returnTotalCost: totalCost } : { totalCost } as any);
    }
  }

  async recalculateProductStoreFromDate(productId: string, storeId: string, fromDate: Date, manager?: EntityManager): Promise<void> {
    const em = await this.managerOf(manager);
    await em.getRepository(InventoryTransaction).createQueryBuilder().delete().where({ productId, storeId } as any).andWhere('"occurredAt" >= :fromDate', { fromDate }).execute();
    const state = await this.previousState(productId, storeId, fromDate, em);
    const events = await this.loadEvents(productId, storeId, fromDate, em);
    const orderIds: string[] = [];
    for (const event of events) {
      const oldCost = state.cost;
      if (event.price) {
        state.cost = Number(event.price.costPrice) || 0;
        state.value = state.quantity * state.cost;
      } else {
        const signedQty = (event.sign || 1) * event.quantity;
        const amount = Math.abs(signedQty * state.cost);
        state.quantity += signedQty;
        state.value += (event.sign || 1) * amount;
        state.value = state.quantity * state.cost;
      }
      const tx = em.getRepository(InventoryTransaction).create({
        occurredAt: event.occurredAt,
        productId,
        storeId,
        quantity: event.price ? 0 : (event.sign || 1) * event.quantity,
        amount: event.price ? Math.abs(state.quantity * (state.cost - oldCost)) : Math.abs((event.sign || 1) * event.quantity * state.cost),
        type: event.price ? (state.cost >= oldCost ? TransactionType.IN : TransactionType.OUT) : ((event.sign || 1) > 0 ? TransactionType.IN : TransactionType.OUT),
        costPriceAfter: state.cost,
        quantityAfter: state.quantity,
        inventoryValueAfter: state.value,
        refType: event.refType,
        refId: event.refId,
        refCode: event.refCode,
      });
      await em.getRepository(InventoryTransaction).save(tx);
      if (event.order) orderIds.push(event.order.id);
    }
    await this.syncOrderCosts(orderIds, em);
    await this.stockMetadata.updateStockMetadata(productId, em);
  }

  async recalculateProductWarehouseFromDate(productId: string, warehouseId: string, fromDate: Date, manager?: EntityManager): Promise<void> {
    return this.recalculateProductStoreFromDate(productId, warehouseId, fromDate, manager);
  }

  async recalculateFromDate(nodes: InventoryRecalculateNode[] | Date, manager?: EntityManager): Promise<void> {
    const em = await this.managerOf(manager);
    if (nodes instanceof Date) {
      const products = await em.getRepository(Product).find({ where: { deletedAt: IsNull() } as any, relations: { storeProducts: true } });
      for (const product of products) for (const storeProduct of product.storeProducts || []) await this.recalculateProductStoreFromDate(product.id, storeProduct.storeId, nodes, em);
      return;
    }
    for (const node of nodes) await this.recalculateProductStoreFromDate(node.productId, node.storeId, new Date(node.fromDate), em);
  }

  async collectAffectedInventoryNodes(nodes: InventoryRecalculateNode[], _manager?: EntityManager): Promise<InventoryRecalculateNode[]> {
    const result = new Map<string, InventoryRecalculateNode>();
    for (const node of nodes || []) {
      const key = `${node.productId}:${node.storeId}`;
      const current = result.get(key);
      if (!current || new Date(node.fromDate) < new Date(current.fromDate)) result.set(key, node);
    }
    return [...result.values()];
  }
}
