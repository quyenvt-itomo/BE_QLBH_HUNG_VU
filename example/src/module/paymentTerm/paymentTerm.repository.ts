import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PaymentTerm } from "@/database/models/company/PaymentTerm";
import {
  PaymentTermSelectFull,
  PaymentTermRelations,
} from "./paymentTerm.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";

@injectable()
export class PaymentTermRepository extends BaseRepository<PaymentTerm> {
  protected entityClass = PaymentTerm;
  protected selectedFields = PaymentTermSelectFull;
  protected relations = PaymentTermRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PaymentTerm>,
    options: IFindPaginationOptions<PaymentTerm>,
  ): Promise<void> {}
}
