import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { FundTransfer } from "@/database/models/FundTransfer";
import {
  FundTransferSelectFull,
  FundTransferRelations,
} from "./fundTransfer.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { FundTransferQueryDto } from "./fundTransfer.validator";

@injectable()
export class FundTransferRepository extends BaseRepository<FundTransfer> {
  protected entityClass = FundTransfer;
  protected selectedFields = FundTransferSelectFull;
  protected relations = FundTransferRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<FundTransfer>,
    options: IFindPaginationOptions<FundTransfer>,
  ): Promise<void> {
    const alias = qb.alias;
    const { fromFundId, toFundId } =
      (options?.moreQuery as FundTransferQueryDto) || {};

    if (fromFundId) {
      qb.andWhere(`${alias}.fromFundId = :fromFundId`, { fromFundId });
    }
    if (toFundId) {
      qb.andWhere(`${alias}.toFundId = :toFundId`, { toFundId });
    }
  }
}
