import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { LoyaltyPointTransaction } from "@/database/models/LoyaltyPointTransaction";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";

export const LoyaltyPointTransactionSelectFull: (keyof LoyaltyPointTransaction)[] =
  [
    "id",
    "occurredAt",
    "partnerId",
    "type",
    "points",
    "refType",
    "refId",
    "refCode",
    "note",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ];

@injectable()
export class LoyaltyPointTransactionRepository extends BaseRepository<LoyaltyPointTransaction> {
  protected entityClass = LoyaltyPointTransaction;
  protected selectedFields = LoyaltyPointTransactionSelectFull;
  protected relations = {};

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<LoyaltyPointTransaction>,
    options: IFindPaginationOptions<LoyaltyPointTransaction>,
  ): Promise<void> {
    await super.extendQueryBuilder?.(qb, options);

    const { partnerId, refId, refType, type, fromDate, toDate, refCode } =
      options?.moreQuery || {};

    // Filters
    if (partnerId) {
      qb.andWhere(`${qb.alias}.partnerId = :partnerId`, { partnerId });
    }

    if (refId) {
      qb.andWhere(`${qb.alias}.refId = :refId`, { refId });
    }

    if (refType) {
      qb.andWhere(`${qb.alias}.refType = :refType`, { refType });
    }

    if (type) {
      qb.andWhere(`${qb.alias}.type = :type`, { type });
    }

    if (fromDate) {
      qb.andWhere(`${qb.alias}.occurredAt >= :fromDate`, { fromDate });
    }

    if (toDate) {
      qb.andWhere(`${qb.alias}.occurredAt <= :toDate`, { toDate });
    }

    if (refCode) {
      qb.andWhere(`${qb.alias}.refCode ILIKE :refCode`, {
        refCode: `%${refCode}%`,
      });
    }

    // Default sorting
    qb.orderBy(`${qb.alias}.occurredAt`, "DESC");
    qb.addOrderBy(`${qb.alias}.createdAt`, "DESC");
  }
}
