import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { QuotationLine } from "@/database/models/company/QuotationLine";
import {
  QuotationLineSelectFull,
  QuotationLineRelations,
} from "./quotationLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { QuotationLineQueryDto } from "./quotationLine.validator";

@injectable()
export class QuotationLineRepository extends BaseRepository<QuotationLine> {
  protected entityClass = QuotationLine;
  protected selectedFields = QuotationLineSelectFull;
  protected relations = QuotationLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<QuotationLine>,
    options: IFindPaginationOptions<QuotationLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { quotationId, productId, type } =
      (options?.moreQuery as QuotationLineQueryDto) || {};

    if (quotationId) {
      qb.andWhere(`${alias}.quotationId = :quotationId`, { quotationId });
    }
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
  }
}
