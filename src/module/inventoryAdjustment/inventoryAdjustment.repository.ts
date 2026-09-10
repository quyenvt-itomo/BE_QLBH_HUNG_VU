import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";
import { InventoryAdjustmentRelations, InventoryAdjustmentRelationsList, InventoryAdjustmentSelectFull, InventoryAdjustmentSelectList } from "./inventoryAdjustment.select";
@injectable()
export class InventoryAdjustmentRepository extends BaseRepository<InventoryAdjustment> {
  protected entityClass = InventoryAdjustment;
  protected selectedFields = InventoryAdjustmentSelectFull;
  protected selectedFieldsForList = InventoryAdjustmentSelectList;
  protected relations = InventoryAdjustmentRelations;
  protected relationsForList = InventoryAdjustmentRelationsList;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<InventoryAdjustment>,
    options: IFindPaginationOptions<InventoryAdjustment>,
  ): Promise<void> {
    const productIds = (options.moreQuery as any)?.productIds;
    if (!this.checkArrayFilter(productIds)) return;

    const alias = qb.alias;
    const subQuery = qb
      .subQuery()
      .select("1")
      .from(InventoryAdjustmentLine, "adjustmentLine")
      .where(`adjustmentLine.adjustmentId = ${alias}.id`)
      .andWhere("adjustmentLine.productId IN (:...adjustmentProductIds)")
      .andWhere("adjustmentLine.deletedAt IS NULL")
      .getQuery();

    qb.andWhere(`EXISTS ${subQuery}`).setParameter("adjustmentProductIds", productIds);
  }
}
