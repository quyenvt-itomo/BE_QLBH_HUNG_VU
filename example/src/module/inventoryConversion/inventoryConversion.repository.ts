import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { InventoryConversion } from "@/database/models/company/InventoryConversion";
import {
  InventoryConversionSelectFull,
  InventoryConversionRelations,
} from "./inventoryConversion.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { InventoryConversionQueryDto } from "./inventoryConversion.validator";

@injectable()
export class InventoryConversionRepository extends BaseRepository<InventoryConversion> {
  protected entityClass = InventoryConversion;
  protected selectedFields = InventoryConversionSelectFull;
  protected relations = InventoryConversionRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<InventoryConversion>,
    options: IFindPaginationOptions<InventoryConversion>,
  ): Promise<void> {
    const alias = qb.alias;
    const { staffId } =
      (options?.moreQuery as InventoryConversionQueryDto) || {};

    if (staffId) {
      qb.andWhere(`${alias}.staffId = :staffId`, { staffId });
    }
  }
}
