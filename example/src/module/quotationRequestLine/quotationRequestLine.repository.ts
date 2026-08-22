import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { QuotationRequestLine } from "@/database/models/company/QuotationRequestLine";
import {
  QuotationRequestLineSelectFull,
  QuotationRequestLineRelations,
} from "./quotationRequestLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { QuotationRequestLineQueryDto } from "./quotationRequestLine.validator";

@injectable()
export class QuotationRequestLineRepository extends BaseRepository<QuotationRequestLine> {
  protected entityClass = QuotationRequestLine;
  protected selectedFields = QuotationRequestLineSelectFull;
  protected relations = QuotationRequestLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<QuotationRequestLine>,
    options: IFindPaginationOptions<QuotationRequestLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { quotationRequestId, productId } =
      (options?.moreQuery as QuotationRequestLineQueryDto) || {};

    if (quotationRequestId) {
      qb.andWhere(`${alias}.quotationRequestId = :quotationRequestId`, {
        quotationRequestId,
      });
    }
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
  }
}
