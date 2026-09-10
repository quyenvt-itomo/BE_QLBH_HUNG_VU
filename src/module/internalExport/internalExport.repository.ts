import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { InternalExport } from "@/database/models/store/InternalExport";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { InternalExportLine } from "@/database/models/store/InternalExportLine";
import {
  InternalExportRelations,
  InternalExportRelationsList,
  InternalExportSelectFull,
  InternalExportSelectList,
} from "./internalExport.select";

@injectable()
export class InternalExportRepository extends BaseRepository<InternalExport> {
  protected entityClass = InternalExport;
  protected selectedFields = InternalExportSelectFull;
  protected selectedFieldsForList = InternalExportSelectList;
  protected relations = InternalExportRelations;
  protected relationsForList = InternalExportRelationsList;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<InternalExport>,
    options: IFindPaginationOptions<InternalExport>,
  ): Promise<void> {
    const productIds = (options.moreQuery as any)?.productIds;
    if (!this.checkArrayFilter(productIds)) return;

    const alias = qb.alias;
    const subQuery = qb
      .subQuery()
      .select("1")
      .from(InternalExportLine, "internalExportLine")
      .where(`internalExportLine.internalExportId = ${alias}.id`)
      .andWhere("internalExportLine.productId IN (:...internalExportProductIds)")
      .andWhere("internalExportLine.deletedAt IS NULL")
      .getQuery();

    qb.andWhere(`EXISTS ${subQuery}`).setParameter("internalExportProductIds", productIds);
  }
}
