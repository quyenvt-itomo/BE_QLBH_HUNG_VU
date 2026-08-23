import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { InventoryAdjustmentRepository } from "./inventoryAdjustment.repository";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
import { InventoryAdjustment } from "@/database/models/company/InventoryAdjustment";
import { InventoryAdjustmentLine } from "@/database/models/company/InventoryAdjustmentLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { withTransaction } from "@/shared/base/TransactionManager";

@injectable()
export class InventoryAdjustmentService extends BaseService<InventoryAdjustment> {
  protected repository: InventoryAdjustmentRepository;
  protected uniqueFields: (keyof InventoryAdjustment)[] = ["code"];
  protected uniqueScope?: (keyof InventoryAdjustment)[] = ["storeId"];
  protected searchableFields = ["code", "reason"];
  protected timeField: keyof InventoryAdjustment = "occurredAt";

  constructor(
    @inject(INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRepository)
    repository: InventoryAdjustmentRepository,
  ) {
    super();
    this.repository = repository;
  }

  async update(
    id: string,
    data: DeepPartial<InventoryAdjustment>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<InventoryAdjustment | null> {
    const { lines, ...safeData } = data;
    const result = await super.update(
      id,
      safeData as DeepPartial<InventoryAdjustment>,
      manager,
      req,
    );
    if (lines !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const lineRepo = trxManager.getRepository(InventoryAdjustmentLine);
        const existing = await lineRepo.find({
          where: { adjustmentId: id },
        });
        const incomingIds = new Set(
          lines.map((l: any) => l.id).filter(Boolean),
        );
        const removedIds = existing
          .map((l) => l.id)
          .filter((lid) => !incomingIds.has(lid));
        if (removedIds.length > 0) {
          await lineRepo.softDelete(removedIds);
        }
        const toSave = lines.map((l: any, i: number) => ({
          ...l,
          adjustmentId: id,
          sortOrder: l.sortOrder || 10 * (i + 1),
        }));
        if (toSave.length > 0) {
          await lineRepo.save(toSave);
        }
      };
      if (manager) {
        await run(manager);
      } else {
        await withTransaction(run);
      }
    }
    return result;
  }

  async validateBeforeCreate(
    data: DeepPartial<InventoryAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<InventoryAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}
}
