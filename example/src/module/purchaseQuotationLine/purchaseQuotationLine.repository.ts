import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PurchaseQuotationLine } from "@/database/models/company/PurchaseQuotationLine";
import {
  PurchaseQuotationLineSelectFull,
  PurchaseQuotationLineRelations,
} from "./purchaseQuotationLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { PurchaseQuotationLineQueryDto } from "./purchaseQuotationLine.validator";

@injectable()
export class PurchaseQuotationLineRepository extends BaseRepository<PurchaseQuotationLine> {
  protected entityClass = PurchaseQuotationLine;
  protected selectedFields = PurchaseQuotationLineSelectFull;
  protected relations = PurchaseQuotationLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PurchaseQuotationLine>,
    options: IFindPaginationOptions<PurchaseQuotationLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { purchaseQuotationId, productId } =
      (options?.moreQuery as PurchaseQuotationLineQueryDto) || {};

    if (purchaseQuotationId) {
      qb.andWhere(`${alias}.purchaseQuotationId = :purchaseQuotationId`, {
        purchaseQuotationId,
      });
    }
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
  }
}
