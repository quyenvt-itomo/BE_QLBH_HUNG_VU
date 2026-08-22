import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { InventoryAdjustmentLine } from "@/database/models/company/InventoryAdjustmentLine";
import {
  InventoryAdjustmentLineSelectFull,
  InventoryAdjustmentLineRelations,
} from "./inventoryAdjustmentLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { InventoryAdjustmentLineQueryDto } from "./inventoryAdjustmentLine.validator";

@injectable()
export class InventoryAdjustmentLineRepository extends BaseRepository<InventoryAdjustmentLine> {
  protected entityClass = InventoryAdjustmentLine;
  protected selectedFields = InventoryAdjustmentLineSelectFull;
  protected relations = InventoryAdjustmentLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<InventoryAdjustmentLine>,
    options: IFindPaginationOptions<InventoryAdjustmentLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { adjustmentId, productId } =
      (options?.moreQuery as InventoryAdjustmentLineQueryDto) || {};

    if (adjustmentId) {
      qb.andWhere(`${alias}.adjustmentId = :adjustmentId`, { adjustmentId });
    }
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
  }
}
