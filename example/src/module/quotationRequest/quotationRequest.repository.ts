import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { QuotationRequest } from "@/database/models/company/QuotationRequest";
import {
  QuotationRequestSelectFull,
  QuotationRequestRelations,
  QuotationRequestSelectList,
  QuotationRequestRelationsList,
  QuotationRequestRelationSelects,
  QuotationRequestRelationSelectsForList,
} from "./quotationRequest.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { QuotationRequestQueryDto } from "./quotationRequest.validator";

@injectable()
export class QuotationRequestRepository extends BaseRepository<QuotationRequest> {
  protected entityClass = QuotationRequest;
  protected selectedFields = QuotationRequestSelectFull;
  protected selectedFieldsForList = QuotationRequestSelectList;
  protected relations = QuotationRequestRelations;
  protected relationsForList = QuotationRequestRelationsList;
  protected relationSelects = QuotationRequestRelationSelects;
  protected relationSelectsForList = QuotationRequestRelationSelectsForList;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<QuotationRequest>,
    options: IFindPaginationOptions<QuotationRequest>,
  ): Promise<void> {
    const alias = qb.alias;
    const { approveStatus, customerId, staffId } =
      (options?.moreQuery as QuotationRequestQueryDto) || {};

    if (approveStatus) {
      qb.andWhere(`${alias}.approveStatus = :approveStatus`, { approveStatus });
    }
    if (customerId) {
      qb.andWhere(`${alias}.customerId = :customerId`, { customerId });
    }
    if (staffId) {
      qb.andWhere(`${alias}.staffId = :staffId`, { staffId });
    }
  }
}
