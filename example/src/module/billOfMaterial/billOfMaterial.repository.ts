import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { BillOfMaterial } from "@/database/models/company/BillOfMaterial";
import {
  BillOfMaterialSelectFull,
  BillOfMaterialRelations,
} from "./billOfMaterial.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { BillOfMaterialQueryDto } from "./billOfMaterial.validator";

@injectable()
export class BillOfMaterialRepository extends BaseRepository<BillOfMaterial> {
  protected entityClass = BillOfMaterial;
  protected selectedFields = BillOfMaterialSelectFull;
  protected relations = BillOfMaterialRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<BillOfMaterial>,
    options: IFindPaginationOptions<BillOfMaterial>,
  ): Promise<void> {
    const alias = qb.alias;
    const { productId, unitId } =
      (options?.moreQuery as BillOfMaterialQueryDto) || {};

    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
    if (unitId) {
      qb.andWhere(`${alias}.unitId = :unitId`, { unitId });
    }
  }
}
