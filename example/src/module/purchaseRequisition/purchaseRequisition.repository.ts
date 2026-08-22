import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PurchaseRequisition } from "@/database/models/company/PurchaseRequisition";
import {
  PurchaseRequisitionSelectFull,
  PurchaseRequisitionSelectList,
  PurchaseRequisitionRelations,
  PurchaseRequisitionRelationsList,
  PurchaseRequisitionRelationSelects,
  PurchaseRequisitionRelationSelectsForList,
} from "./purchaseRequisition.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { PurchaseRequisitionQueryDto } from "./purchaseRequisition.validator";

@injectable()
export class PurchaseRequisitionRepository extends BaseRepository<PurchaseRequisition> {
  protected entityClass = PurchaseRequisition;
  protected selectedFields = PurchaseRequisitionSelectFull;
  protected selectedFieldsForList = PurchaseRequisitionSelectList;
  protected relations = PurchaseRequisitionRelations;
  protected relationsForList = PurchaseRequisitionRelationsList;
  protected relationSelects = PurchaseRequisitionRelationSelects;
  protected relationSelectsForList = PurchaseRequisitionRelationSelectsForList;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PurchaseRequisition>,
    options: IFindPaginationOptions<PurchaseRequisition>,
  ): Promise<void> {
    const alias = qb.alias;
    const { approveStatus, requesterId, departmentId, orderId, productionId } =
      (options?.moreQuery as PurchaseRequisitionQueryDto) || {};

    if (approveStatus) {
      qb.andWhere(`${alias}.approveStatus = :approveStatus`, { approveStatus });
    }
    if (requesterId) {
      qb.andWhere(`${alias}.requesterId = :requesterId`, { requesterId });
    }
    if (departmentId) {
      qb.andWhere(`${alias}.departmentId = :departmentId`, { departmentId });
    }
    if (orderId) {
      qb.andWhere(`${alias}.orderId = :orderId`, { orderId });
    }
    if (productionId) {
      qb.andWhere(`${alias}.productionId = :productionId`, { productionId });
    }
  }
}
