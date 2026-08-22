import { injectable } from "inversify";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { FundTransfer } from "@/database/models/FundTransfer";
import {
  FundTransferRelations,
  FundTransferSelectFull,
} from "./fundTransfer.select";
import { SelectQueryBuilder } from "typeorm";
import { IFindPaginationOptions } from "@/shared/base/BaseRepository";

@injectable()
export class FundTransferRepository extends BaseRepository<FundTransfer> {
  protected entityClass = FundTransfer;
  protected selectedFields = FundTransferSelectFull;
  protected relations = FundTransferRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<FundTransfer>,
    options: IFindPaginationOptions<FundTransfer>,
  ): Promise<void> {
    // giữ nguyên logic cha (nếu có)
    super.extendQueryBuilder?.(qb, options);

    const { fundIds, storeId } = options?.moreQuery || {};

    if (fundIds) {
      qb.andWhere(
        `(${qb.alias}.fromFundId IN (:...fundIds)
        OR ${qb.alias}.toFundId IN (:...fundIds))`,
        {
          fundIds,
        },
      );
    }

    if (storeId) {
      qb.andWhere(
        `${qb.alias}.fromFundId IN (
          SELECT f.id FROM funds f WHERE f."storeId" = :storeId AND f."deletedAt" IS NULL
        )
        AND ${qb.alias}.toFundId IN (
          SELECT f.id FROM funds f WHERE f."storeId" = :storeId AND f."deletedAt" IS NULL
        )`,
        { storeId },
      );
    }
  }
}
