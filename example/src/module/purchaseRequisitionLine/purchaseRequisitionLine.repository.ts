import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PurchaseRequisitionLine } from "@/database/models/company/PurchaseRequisitionLine";
import {
  PurchaseRequisitionLineSelectFull,
  PurchaseRequisitionLineRelations,
} from "./purchaseRequisitionLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { PurchaseRequisitionLineQueryDto } from "./purchaseRequisitionLine.validator";

@injectable()
export class PurchaseRequisitionLineRepository extends BaseRepository<PurchaseRequisitionLine> {
  protected entityClass = PurchaseRequisitionLine;
  protected selectedFields = PurchaseRequisitionLineSelectFull;
  protected relations = PurchaseRequisitionLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PurchaseRequisitionLine>,
    options: IFindPaginationOptions<PurchaseRequisitionLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { purchaseRequisitionId, productId } =
      (options?.moreQuery as PurchaseRequisitionLineQueryDto) || {};

    if (purchaseRequisitionId) {
      qb.andWhere(`${alias}.purchaseRequisitionId = :purchaseRequisitionId`, {
        purchaseRequisitionId,
      });
    }
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
  }
}
