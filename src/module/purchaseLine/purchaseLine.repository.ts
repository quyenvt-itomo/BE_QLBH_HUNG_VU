import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PurchaseLine } from "@/database/models/company/PurchaseLine";
import {
  PurchaseLineSelectFull,
  PurchaseLineRelations,
} from "./purchaseLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { PurchaseLineQueryDto } from "./purchaseLine.validator";

@injectable()
export class PurchaseLineRepository extends BaseRepository<PurchaseLine> {
  protected entityClass = PurchaseLine;
  protected selectedFields = PurchaseLineSelectFull;
  protected relations = PurchaseLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PurchaseLine>,
    options: IFindPaginationOptions<PurchaseLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { purchaseId, productId } =
      (options?.moreQuery as PurchaseLineQueryDto) || {};

    if (purchaseId) {
      qb.andWhere(`${alias}.purchaseId = :purchaseId`, { purchaseId });
    }
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
  }
}
