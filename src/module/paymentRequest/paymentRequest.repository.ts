import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PaymentRequest } from "@/database/models/company/PaymentRequest";
import {
  PaymentRequestSelectFull,
  PaymentRequestRelations,
} from "./paymentRequest.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { PaymentRequestQueryDto } from "./paymentRequest.validator";

@injectable()
export class PaymentRequestRepository extends BaseRepository<PaymentRequest> {
  protected entityClass = PaymentRequest;
  protected selectedFields = PaymentRequestSelectFull;
  protected relations = PaymentRequestRelations;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PaymentRequest>,
    options: IFindPaginationOptions<PaymentRequest>,
  ): Promise<void> {
    const alias = qb.alias;
    const { type, approveStatus, partnerId, staffId } =
      (options?.moreQuery as PaymentRequestQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
    if (approveStatus) {
      qb.andWhere(`${alias}.approveStatus = :approveStatus`, { approveStatus });
    }
    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, { partnerId });
    }
    if (staffId) {
      qb.andWhere(`${alias}.staffId = :staffId`, { staffId });
    }
  }
}
