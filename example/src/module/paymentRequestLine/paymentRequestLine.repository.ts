import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PaymentRequestLine } from "@/database/models/company/PaymentRequestLine";
import {
  PaymentRequestLineSelectFull,
  PaymentRequestLineRelations,
} from "./paymentRequestLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { PaymentRequestLineQueryDto } from "./paymentRequestLine.validator";

@injectable()
export class PaymentRequestLineRepository extends BaseRepository<PaymentRequestLine> {
  protected entityClass = PaymentRequestLine;
  protected selectedFields = PaymentRequestLineSelectFull;
  protected relations = PaymentRequestLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PaymentRequestLine>,
    options: IFindPaginationOptions<PaymentRequestLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { paymentRequestId, invoiceId, orderId, isPaid } =
      (options?.moreQuery as PaymentRequestLineQueryDto) || {};

    if (paymentRequestId) {
      qb.andWhere(`${alias}.paymentRequestId = :paymentRequestId`, {
        paymentRequestId,
      });
    }
    if (invoiceId) {
      qb.andWhere(`${alias}.invoiceId = :invoiceId`, { invoiceId });
    }
    if (orderId) {
      qb.andWhere(`${alias}.orderId = :orderId`, { orderId });
    }
    if (isPaid !== undefined) {
      qb.andWhere(`${alias}.isPaid = :isPaid`, { isPaid });
    }
  }
}
