import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";
import { StoreTransferRelations, StoreTransferRelationsList, StoreTransferSelectFull, StoreTransferSelectList } from "./storeTransfer.select";
@injectable()
export class StoreTransferRepository extends BaseRepository<StoreTransfer> {
  protected entityClass = StoreTransfer;
  protected selectedFields = StoreTransferSelectFull;
  protected selectedFieldsForList = StoreTransferSelectList;
  protected relations = StoreTransferRelations;
  protected relationsForList = StoreTransferRelationsList;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<StoreTransfer>,
    options: IFindPaginationOptions<StoreTransfer>,
  ): Promise<void> {
    const query = (options.moreQuery || {}) as any;
    const statuses = query.statuses;
    const fromStoreIds = query.fromStoreIds || (query.fromStoreId ? [query.fromStoreId] : undefined);
    const toStoreIds = query.toStoreIds || (query.toStoreId ? [query.toStoreId] : undefined);

    if (this.checkArrayFilter(statuses)) {
      qb.andWhere(`${qb.alias}.status IN (:...transferStatuses)`, {
        transferStatuses: statuses,
      });
    }
    if (this.checkArrayFilter(fromStoreIds)) {
      qb.andWhere(`${qb.alias}.fromStoreId IN (:...transferFromStoreIds)`, {
        transferFromStoreIds: fromStoreIds,
      });
    }
    if (this.checkArrayFilter(toStoreIds)) {
      qb.andWhere(`${qb.alias}.toStoreId IN (:...transferToStoreIds)`, {
        transferToStoreIds: toStoreIds,
      });
    }

    const productIds = query.productIds;
    if (!this.checkArrayFilter(productIds)) return;

    const subQuery = qb
      .subQuery()
      .select("1")
      .from(StoreTransferLine, "transferLine")
      .where(`transferLine.transferId = ${qb.alias}.id`)
      .andWhere("transferLine.productId IN (:...transferProductIds)")
      .andWhere("transferLine.deletedAt IS NULL")
      .getQuery();

    qb.andWhere(`EXISTS ${subQuery}`).setParameter("transferProductIds", productIds);
  }
}
