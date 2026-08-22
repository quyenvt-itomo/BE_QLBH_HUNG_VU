import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { QuotationCommission } from "@/database/models/company/QuotationCommission";
import {
  QuotationCommissionSelectFull,
  QuotationCommissionRelations,
} from "./quotationCommission.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { QuotationCommissionQueryDto } from "./quotationCommission.validator";

@injectable()
export class QuotationCommissionRepository extends BaseRepository<QuotationCommission> {
  protected entityClass = QuotationCommission;
  protected selectedFields = QuotationCommissionSelectFull;
  protected relations = QuotationCommissionRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<QuotationCommission>,
    options: IFindPaginationOptions<QuotationCommission>,
  ): Promise<void> {
    const alias = qb.alias;
    const { quotationId, partnerContactId } =
      (options?.moreQuery as QuotationCommissionQueryDto) || {};

    if (quotationId) {
      qb.andWhere(`${alias}.quotationId = :quotationId`, { quotationId });
    }
    if (partnerContactId) {
      qb.andWhere(`${alias}.partnerContactId = :partnerContactId`, {
        partnerContactId,
      });
    }
  }
}
