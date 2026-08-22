import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { injectable } from "inversify";
import {
  InventoryAdjustmentSelectFull,
  InventoryAdjustmentRelations,
} from "./inventoryAdjustment.select";
import { SelectQueryBuilder } from "typeorm";

/**
 * InventoryAdjustment Repository - Tenant Entity
 */
@injectable()
export class InventoryAdjustmentRepository extends BaseRepository<InventoryAdjustment> {
  protected entityClass = InventoryAdjustment;
  protected selectedFields = InventoryAdjustmentSelectFull;
  protected relations = InventoryAdjustmentRelations;
  protected nestedFileFields = ["lines.productVariant"];

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<InventoryAdjustment>,
    options: IFindPaginationOptions<InventoryAdjustment>,
  ): Promise<void> {
    await super.extendQueryBuilder?.(qb, options);

    const { employeeIds, productIds, storeId, sortBy, sortOrder } =
      options?.moreQuery || {};

    if (storeId) {
      qb.andWhere(`${qb.alias}.storeId = :storeId`, {
        storeId,
      });
    }

    // employeeIds filter
    if (this.checkArrayFilter(employeeIds)) {
      qb.andWhere(`${qb.alias}.adjustedById IN (:...employeeIds)`, {
        employeeIds,
      });
    }

    if (this.checkArrayFilter(productIds)) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 
          FROM inventory_adjustment_lines ial
          INNER JOIN product_variants pv ON ial."productVariantId" = pv.id
          WHERE ial."adjustmentId" = ${qb.alias}.id 
            AND pv."productId" IN (:...productIds)
            AND ial."deletedAt" IS NULL
        )`,
        { productIds },
      );
    }

    // ===== Xử lý sắp xếp (sử dụng column từ DB) =====
    if (sortBy && sortOrder) {
      if (sortBy === "totalAdjustmentQty") {
        qb.orderBy(`${qb.alias}.totalAdjustmentQty`, sortOrder);
      } else if (sortBy === "totalAdjustmentValue") {
        qb.orderBy(`${qb.alias}.totalAdjustmentValue`, sortOrder);
      }
    }
  }
}
