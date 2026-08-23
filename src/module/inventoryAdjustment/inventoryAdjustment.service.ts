import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { SimpleService } from "../_shared/simple.service";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";
import { Product } from "@/database/models/Product";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
import { INVENTORY_TYPES } from "../inventory/inventory.types";
import { InventoryRecalculateService } from "../inventory/inventoryRecalculate.service";
import { withTransaction } from "@/shared/base/TransactionManager";

@injectable()
export class InventoryAdjustmentService extends SimpleService<InventoryAdjustment> {
  constructor(
    @inject(INVENTORY_ADJUSTMENT_TYPES.Repository) repository: import("./inventoryAdjustment.repository").InventoryAdjustmentRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService) private readonly inventory: InventoryRecalculateService,
  ) {
    super(repository, "store", "inventoryadjustment");
  }

  private async prepareLines(lines: any[] | undefined, manager: EntityManager): Promise<void> {
    if (!Array.isArray(lines)) return;
    for (const line of lines) {
      if (!line.productId) throw new Error("inventory.adjustment.line.product.required");
      const product = await manager.getRepository(Product).findOne({ where: { id: line.productId } as any });
      if (!product) throw new Error("product.not_found");
      Object.assign(line, { productSnapshot: { id: product.id, code: product.code, name: product.name } });
    }
  }

  private async syncLines(adjustmentId: string, lines: any[], manager: EntityManager): Promise<string[]> {
    const repository = manager.getRepository(InventoryAdjustmentLine);
    const existing = await repository.find({ where: { adjustmentId } as any });
    const oldProductIds = existing.map((line) => line.productId).filter((id): id is string => Boolean(id));
    const incomingIds = new Set<string>();

    for (const line of lines) {
      const entity = line.id ? existing.find((item) => item.id === line.id) : undefined;
      const payload = { ...line, adjustmentId };
      delete payload.id;
      const saved: InventoryAdjustmentLine = await repository.save((entity ? repository.merge(entity, payload) : repository.create(payload)) as any) as InventoryAdjustmentLine;
      incomingIds.add(saved.id);
    }
    for (const line of existing) if (!incomingIds.has(line.id)) await repository.delete(line.id);
    return [...new Set(oldProductIds)];
  }

  private async replay(id: string, manager: EntityManager, extraProductIds: string[] = []): Promise<void> {
    const adjustment = await manager.getRepository(InventoryAdjustment).findOne({ where: { id }, relations: { lines: true } });
    if (!adjustment) return;
    const productIds = [...new Set([
      ...extraProductIds,
      ...(adjustment.lines || []).map((line) => line.productId).filter((id): id is string => Boolean(id)),
    ])];
    for (const productId of productIds) await this.inventory.recalculateProductStoreFromDate(productId, adjustment.storeId, adjustment.occurredAt, manager);
  }

  async validateBeforeCreate(data: DeepPartial<InventoryAdjustment>, manager: EntityManager, req?: import("@/shared/types/interfaces").RequestContext): Promise<void> {
    await super.validateBeforeCreate(data, manager, req);
    await this.prepareLines((data as any).lines, manager);
  }

  async update(id: string, data: DeepPartial<InventoryAdjustment>, manager?: EntityManager, req?: import("@/shared/types/interfaces").RequestContext): Promise<InventoryAdjustment | null> {
    const run = async (em: EntityManager): Promise<InventoryAdjustment | null> => {
      const payload = { ...(data as any) };
      const lines = payload.lines;
      delete payload.lines;
      const current = await em.getRepository(InventoryAdjustment).findOne({ where: { id }, relations: { lines: true } });
      if (!current) return null;
      await this.prepareLines(lines, em);
      const updated = await super.update(id, payload, em, req);
      if (!updated || !Array.isArray(lines)) return updated;
      const oldProductIds = await this.syncLines(id, lines, em);
      await this.replay(id, em, oldProductIds);
      return (await em.getRepository(InventoryAdjustment).findOne({ where: { id }, relations: { lines: true } })) || updated;
    };
    return manager ? run(manager) : withTransaction(run);
  }

  async actionAfterCreate(data: InventoryAdjustment, manager: EntityManager): Promise<void> { await this.replay(data.id, manager); }
  async actionAfterUpdate(data: InventoryAdjustment, manager: EntityManager): Promise<void> { await this.replay(data.id, manager); }

  async validateBeforeDelete(data: InventoryAdjustment, manager: EntityManager, req?: import("@/shared/types/interfaces").RequestContext): Promise<void> {
    await super.validateBeforeDelete(data, manager, req);
    const current = await manager.getRepository(InventoryAdjustment).findOne({ where: { id: data.id }, relations: { lines: true } });
    if (current) (data as any).lines = current.lines;
  }

  async actionAfterDelete(data: InventoryAdjustment, manager: EntityManager): Promise<void> {
    const productIds = new Set<string>(((data as any).lines || []).map((line: InventoryAdjustmentLine) => line.productId).filter((id: string | null): id is string => Boolean(id)));
    for (const productId of productIds) await this.inventory.recalculateProductStoreFromDate(productId, data.storeId, data.occurredAt, manager);
  }
}
