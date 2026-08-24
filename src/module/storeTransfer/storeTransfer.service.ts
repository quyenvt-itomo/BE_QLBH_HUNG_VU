import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { generateCode } from "@/shared/utils/code.utils";
import { withTransaction } from "@/shared/base/TransactionManager";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";
import { StoreTransferRepository } from "./storeTransfer.repository";
import { StoreTransferLineRepository } from "./storeTransferLine.repository";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";
import { INVENTORY_TYPES } from "../inventory/inventory.types";
import { InventoryRecalculateService } from "../inventory/inventoryRecalculate.service";
import { PRODUCT_TYPES } from "../product/product.types";
import { ProductRepository } from "../product/product.repository";
import { ATTRIBUTE_TYPES } from "../attribute/attribute.types";
import { AttributeRepository } from "../attribute/attribute.repository";
import { STORE_TYPES } from "../store/store.types";
import { StoreRepository } from "../store/store.repository";

@injectable()
export class StoreTransferService extends BaseService<StoreTransfer> {
  protected repository: StoreTransferRepository;
  protected uniqueFields: (keyof StoreTransfer)[] = ["code"];
  constructor(
    @inject(STORE_TRANSFER_TYPES.Repository) repository: StoreTransferRepository,
    @inject(STORE_TRANSFER_TYPES.LineRepository) private lineRepository: StoreTransferLineRepository,
    @inject(PRODUCT_TYPES.ProductRepository) private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository) private attributeRepository: AttributeRepository,
    @inject(STORE_TYPES.StoreRepository) private storeRepository: StoreRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService) private inventory: InventoryRecalculateService,
  ) { super(); this.repository = repository; }

  private async prepareLines(lines: any[] | undefined, manager: EntityManager): Promise<void> {
    if (!Array.isArray(lines)) return;
    for (const line of lines) {
      if (!line.productId) throw new Error("store.transfer.line.product.required");
      await this.productRepository.attachInfo(line, manager);
      if (!line.productSnapshot) throw new Error("product.not_found");
      await this.attributeRepository.attachUnitInfo(line, manager);
      await this.productRepository.attachUnitConversion(line, manager);
    }
  }

  private async syncLines(transferId: string, lines: any[], manager: EntityManager): Promise<string[]> {
    const repository = this.lineRepository.getRepository(manager);
    const existing = await repository.find({ where: { transferId } as any });
    const oldProductIds = existing.map((line) => line.productId).filter((id): id is string => Boolean(id));
    const incomingIds = new Set<string>();
    for (const line of lines) { const entity = line.id ? existing.find((item) => item.id === line.id) : undefined; const payload = { ...line, transferId }; delete payload.id; const saved = await repository.save((entity ? repository.merge(entity, payload) : repository.create(payload)) as any) as StoreTransferLine; incomingIds.add(saved.id); }
    for (const line of existing) if (!incomingIds.has(line.id)) await repository.delete(line.id);
    return [...new Set(oldProductIds)];
  }

  private async replay(id: string, manager: EntityManager, extraProductIds: string[] = [], oldStores: string[] = []): Promise<void> {
    const transfer = await this.repository.getRepository(manager).findOne({ where: { id }, relations: { lines: true } });
    if (!transfer) return;
    const productIds = [...new Set([...extraProductIds, ...(transfer.lines || []).map((line) => line.productId).filter((id): id is string => Boolean(id))])];
    const storeIds = [...new Set([...oldStores, transfer.fromStoreId, transfer.toStoreId].filter((id): id is string => Boolean(id)))];
    for (const productId of productIds) for (const storeId of storeIds) await this.inventory.recalculateProductStoreFromDate(productId, storeId, transfer.occurredAt, manager);
  }

  async validateBeforeCreate(data: DeepPartial<StoreTransfer>, manager: EntityManager): Promise<void> { if (!data.code) data.code = await generateCode("storetransfer"); await this.storeRepository.attachInfo(data as any, manager); if ((data.fromStoreId && !data.fromStoreSnapshot) || (data.toStoreId && !data.toStoreSnapshot)) throw new Error("store.not_found"); await this.prepareLines((data as any).lines, manager); }

  async update(id: string, data: DeepPartial<StoreTransfer>, manager?: EntityManager, req?: RequestContext): Promise<StoreTransfer | null> {
    const run = async (em: EntityManager): Promise<StoreTransfer | null> => { const payload = { ...(data as any) }; const lines = payload.lines; delete payload.lines; const current = await this.repository.getRepository(em).findOne({ where: { id }, relations: { lines: true } }); if (!current) return null; const oldStores = [current.fromStoreId, current.toStoreId].filter((storeId): storeId is string => Boolean(storeId)); await this.prepareLines(lines, em); const updated = await super.update(id, payload, em, req); if (!updated || !Array.isArray(lines)) return updated; const oldProductIds = await this.syncLines(id, lines, em); await this.replay(id, em, oldProductIds, oldStores); return (await this.repository.getRepository(em).findOne({ where: { id }, relations: { lines: true } })) || updated; };
    return manager ? run(manager) : withTransaction(run);
  }
  async actionAfterCreate(data: StoreTransfer, manager: EntityManager): Promise<void> { await this.replay(data.id, manager); }
  async actionAfterUpdate(data: StoreTransfer, manager: EntityManager): Promise<void> { await this.replay(data.id, manager); }
  async validateBeforeDelete(data: StoreTransfer, manager: EntityManager): Promise<void> { const current = await this.repository.getRepository(manager).findOne({ where: { id: data.id }, relations: { lines: true } }); if (current) (data as any).lines = current.lines; }
  async actionAfterDelete(data: StoreTransfer, manager: EntityManager): Promise<void> { const productIds = new Set<string>(((data as any).lines || []).map((line: StoreTransferLine) => line.productId).filter((id: string | null): id is string => Boolean(id))); const stores = [data.fromStoreId, data.toStoreId].filter((id): id is string => Boolean(id)); for (const productId of productIds) for (const storeId of stores) await this.inventory.recalculateProductStoreFromDate(productId, storeId, data.occurredAt, manager); }
}
