import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { SimpleService } from "../_shared/simple.service";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";
import { Product } from "@/database/models/Product";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";
import { INVENTORY_TYPES } from "../inventory/inventory.types";
import { InventoryRecalculateService } from "../inventory/inventoryRecalculate.service";
import { withTransaction } from "@/shared/base/TransactionManager";

@injectable()
export class StoreTransferService extends SimpleService<StoreTransfer> {
  constructor(
    @inject(STORE_TRANSFER_TYPES.Repository) repository: import("./storeTransfer.repository").StoreTransferRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService) private readonly inventory: InventoryRecalculateService,
  ) { super(repository, "mixed", "storetransfer"); }

  private async prepareLines(lines: any[] | undefined, manager: EntityManager): Promise<void> {
    if (!Array.isArray(lines)) return;
    for (const line of lines) {
      if (!line.productId) throw new Error("store.transfer.line.product.required");
      const product = await manager.getRepository(Product).findOne({ where: { id: line.productId } as any, relations: { extraUnits: true } });
      if (!product) throw new Error("product.not_found");
      const extraUnit = product.extraUnits?.find((item) => item.unitId === line.unitId);
      Object.assign(line, {
        productSnapshot: { id: product.id, code: product.code, name: product.name },
        conversionRateAtTime: product.baseUnitId === line.unitId ? 1 : Number(extraUnit?.conversionRate) || Number(line.conversionRateAtTime) || 1,
      });
    }
  }

  private async syncLines(transferId: string, lines: any[], manager: EntityManager): Promise<string[]> {
    const repository = manager.getRepository(StoreTransferLine);
    const existing = await repository.find({ where: { transferId } as any });
    const oldProductIds = existing.map((line) => line.productId).filter((id): id is string => Boolean(id));
    const incomingIds = new Set<string>();
    for (const line of lines) {
      const entity = line.id ? existing.find((item) => item.id === line.id) : undefined;
      const payload = { ...line, transferId };
      delete payload.id;
      const saved: StoreTransferLine = await repository.save((entity ? repository.merge(entity, payload) : repository.create(payload)) as any) as StoreTransferLine;
      incomingIds.add(saved.id);
    }
    for (const line of existing) if (!incomingIds.has(line.id)) await repository.delete(line.id);
    return [...new Set(oldProductIds)];
  }

  private async replay(id: string, manager: EntityManager, extraProductIds: string[] = [], oldStores: string[] = []): Promise<void> {
    const transfer = await manager.getRepository(StoreTransfer).findOne({ where: { id }, relations: { lines: true } });
    if (!transfer) return;
    const productIds = [...new Set([
      ...extraProductIds,
      ...(transfer.lines || []).map((line) => line.productId).filter((id): id is string => Boolean(id)),
    ])];
    const storeIds = [...new Set([...oldStores, transfer.fromStoreId, transfer.toStoreId].filter((id): id is string => Boolean(id)))];
    for (const productId of productIds) {
      for (const storeId of storeIds) await this.inventory.recalculateProductStoreFromDate(productId, storeId, transfer.occurredAt, manager);
    }
  }

  async validateBeforeCreate(data: DeepPartial<StoreTransfer>, manager: EntityManager): Promise<void> {
    await super.validateBeforeCreate(data, manager);
    await this.prepareLines((data as any).lines, manager);
  }

  async update(id: string, data: DeepPartial<StoreTransfer>, manager?: EntityManager, req?: import("@/shared/types/interfaces").RequestContext): Promise<StoreTransfer | null> {
    const run = async (em: EntityManager): Promise<StoreTransfer | null> => {
      const payload = { ...(data as any) };
      const lines = payload.lines;
      delete payload.lines;
      const current = await em.getRepository(StoreTransfer).findOne({ where: { id }, relations: { lines: true } });
      if (!current) return null;
      const oldStores = [current.fromStoreId, current.toStoreId].filter((storeId): storeId is string => Boolean(storeId));
      await this.prepareLines(lines, em);
      const updated = await super.update(id, payload, em, req);
      if (!updated || !Array.isArray(lines)) return updated;
      const oldProductIds = await this.syncLines(id, lines, em);
      await this.replay(id, em, oldProductIds, oldStores);
      return (await em.getRepository(StoreTransfer).findOne({ where: { id }, relations: { lines: true } })) || updated;
    };
    return manager ? run(manager) : withTransaction(run);
  }

  async actionAfterCreate(data: StoreTransfer, manager: EntityManager): Promise<void> { await this.replay(data.id, manager); }
  async actionAfterUpdate(data: StoreTransfer, manager: EntityManager): Promise<void> { await this.replay(data.id, manager); }

  async validateBeforeDelete(data: StoreTransfer, manager: EntityManager): Promise<void> {
    const current = await manager.getRepository(StoreTransfer).findOne({ where: { id: data.id }, relations: { lines: true } });
    if (current) (data as any).lines = current.lines;
  }

  async actionAfterDelete(data: StoreTransfer, manager: EntityManager): Promise<void> {
    const productIds = new Set<string>(((data as any).lines || []).map((line: StoreTransferLine) => line.productId).filter((id: string | null): id is string => Boolean(id)));
    const stores = [data.fromStoreId, data.toStoreId].filter((id): id is string => Boolean(id));
    for (const productId of productIds) for (const storeId of stores) await this.inventory.recalculateProductStoreFromDate(productId, storeId, data.occurredAt, manager);
  }
}
