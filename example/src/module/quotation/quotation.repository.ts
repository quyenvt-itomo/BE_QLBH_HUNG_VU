import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Quotation } from "@/database/models/company/Quotation";
import {
  QuotationSelectFull,
  QuotationSelectList,
  QuotationRelations,
  QuotationRelationsList,
  QuotationRelationSelects,
  QuotationRelationSelectsForList,
} from "./quotation.select";
import { injectable } from "inversify";
import { EntityManager, Not, SelectQueryBuilder } from "typeorm";
import { QuotationQueryDto } from "./quotation.validator";
import { ApproveStatus } from "@/shared/constants/enum";

@injectable()
export class QuotationRepository extends BaseRepository<Quotation> {
  protected entityClass = Quotation;
  protected selectedFields = QuotationSelectFull;
  protected selectedFieldsForList = QuotationSelectList;
  protected relations = QuotationRelations;
  protected relationsForList = QuotationRelationsList;
  protected relationSelects = QuotationRelationSelects;
  protected relationSelectsForList = QuotationRelationSelectsForList;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Quotation>,
    options: IFindPaginationOptions<Quotation>,
  ): Promise<void> {
    const alias = qb.alias;
    const { approveStatus, customerId, staffId, quotationRequestId } =
      (options?.moreQuery as QuotationQueryDto) || {};

    if (approveStatus) {
      qb.andWhere(`${alias}.approveStatus = :approveStatus`, { approveStatus });
    }
    if (customerId) {
      qb.andWhere(`${alias}.customerId = :customerId`, { customerId });
    }
    if (staffId) {
      qb.andWhere(`${alias}.staffId = :staffId`, { staffId });
    }
    if (quotationRequestId) {
      qb.andWhere(`${alias}.quotationRequestId = :quotationRequestId`, {
        quotationRequestId,
      });
    }
  }

  async rejectOtherQuotationsWithSameQuotationRequestId(
    quotation: Quotation,
    reason: string,
    manager?: EntityManager,
  ): Promise<void> {
    if (!quotation.quotationRequestId) return;

    await this.getRepository(manager).update(
      {
        quotationRequestId: quotation.quotationRequestId,
        storeId: quotation.storeId,
        id: Not(quotation.id),
      },
      {
        approveStatus: ApproveStatus.CUSTOMER_REJECTED,
        approvedAt: new Date(),
        rejectReason: reason,
      },
    );
  }
}
