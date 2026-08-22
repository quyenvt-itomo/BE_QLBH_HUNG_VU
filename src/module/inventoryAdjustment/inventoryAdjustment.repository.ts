import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { InventoryAdjustment } from "@/database/models/company/InventoryAdjustment";
import {
  InventoryAdjustmentSelectFull,
  InventoryAdjustmentRelations,
} from "./inventoryAdjustment.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { InventoryAdjustmentQueryDto } from "./inventoryAdjustment.validator";

@injectable()
export class InventoryAdjustmentRepository extends BaseRepository<InventoryAdjustment> {
  protected entityClass = InventoryAdjustment;
  protected selectedFields = InventoryAdjustmentSelectFull;
  protected relations = InventoryAdjustmentRelations;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<InventoryAdjustment>,
    options: IFindPaginationOptions<InventoryAdjustment>,
  ): Promise<void> {
    const alias = qb.alias;
    const { warehouseId, isInitialAdjustment } =
      (options?.moreQuery as InventoryAdjustmentQueryDto) || {};

    if (warehouseId) {
      qb.andWhere(`${alias}.warehouseId = :warehouseId`, { warehouseId });
    }
    if (typeof isInitialAdjustment === "boolean") {
      qb.andWhere(`${alias}.isInitialAdjustment = :isInitialAdjustment`, {
        isInitialAdjustment,
      });
    }
  }
}
