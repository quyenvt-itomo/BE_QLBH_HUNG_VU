import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { StockDocumentLine } from "@/database/models/company/StockDocumentLine";
import {
  StockDocumentLineSelectFull,
  StockDocumentLineRelations,
} from "./stockDocumentLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { StockDocumentLineQueryDto } from "./stockDocumentLine.validator";

@injectable()
export class StockDocumentLineRepository extends BaseRepository<StockDocumentLine> {
  protected entityClass = StockDocumentLine;
  protected selectedFields = StockDocumentLineSelectFull;
  protected relations = StockDocumentLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<StockDocumentLine>,
    options: IFindPaginationOptions<StockDocumentLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { stockDocumentId, productId } =
      (options?.moreQuery as StockDocumentLineQueryDto) || {};

    if (stockDocumentId) {
      qb.andWhere(`${alias}.stockDocumentId = :stockDocumentId`, {
        stockDocumentId,
      });
    }
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
  }
}
