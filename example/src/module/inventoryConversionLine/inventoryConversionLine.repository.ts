import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { InventoryConversionLine } from "@/database/models/company/InventoryConversionLine";
import {
  InventoryConversionLineSelectFull,
  InventoryConversionLineRelations,
} from "./inventoryConversionLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { InventoryConversionLineQueryDto } from "./inventoryConversionLine.validator";

@injectable()
export class InventoryConversionLineRepository extends BaseRepository<InventoryConversionLine> {
  protected entityClass = InventoryConversionLine;
  protected selectedFields = InventoryConversionLineSelectFull;
  protected relations = InventoryConversionLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<InventoryConversionLine>,
    options: IFindPaginationOptions<InventoryConversionLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { inventoryConversionId, fromProductId, toProductId, approveStatus } =
      (options?.moreQuery as InventoryConversionLineQueryDto) || {};

    if (inventoryConversionId) {
      qb.andWhere(`${alias}.inventoryConversionId = :inventoryConversionId`, {
        inventoryConversionId,
      });
    }
    if (fromProductId) {
      qb.andWhere(`${alias}.fromProductId = :fromProductId`, { fromProductId });
    }
    if (toProductId) {
      qb.andWhere(`${alias}.toProductId = :toProductId`, { toProductId });
    }
    if (approveStatus) {
      qb.andWhere(`${alias}.approveStatus = :approveStatus`, { approveStatus });
    }
  }
}
