import { injectable } from "inversify";
import { DebtAdjustment } from "@/database/models/DebtAdjustment";
import { Partner } from "@/database/models/Partner";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { SelectQueryBuilder } from "typeorm";
import { nullUuidMap } from "@/shared/constants/enum";
import { DebtAdjustmentRelations, DebtAdjustmentRelationsList, DebtAdjustmentSelectFull, DebtAdjustmentSelectList } from "./debtAdjustment.select";
@injectable()
export class DebtAdjustmentRepository extends BaseRepository<DebtAdjustment> {
  protected entityClass = DebtAdjustment;
  protected selectedFields = DebtAdjustmentSelectFull;
  protected selectedFieldsForList = DebtAdjustmentSelectList;
  protected relations = DebtAdjustmentRelations;
  protected relationsForList = DebtAdjustmentRelationsList;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<DebtAdjustment>,
    options: IFindPaginationOptions<DebtAdjustment>,
  ): Promise<void> {
    const query = (options.moreQuery || {}) as Record<string, any>;
    const partnerIds = query.partnerIds?.length
      ? query.partnerIds
      : query.partnerId
        ? [query.partnerId]
        : [];
    const partnerGroupIds = query.partnerGroupIds?.length
      ? query.partnerGroupIds
      : query.partnerGroupId
        ? [query.partnerGroupId]
        : [];

    if (query.side) {
      qb.andWhere(`${qb.alias}.side = :debtAdjustmentSide`, { debtAdjustmentSide: query.side });
    }
    if (partnerIds.length) {
      qb.andWhere(`${qb.alias}.partnerId IN (:...debtAdjustmentPartnerIds)`, {
        debtAdjustmentPartnerIds: partnerIds,
      });
    }
    if (partnerGroupIds.length) {
      const nullGroupSelected = partnerGroupIds.includes(nullUuidMap.partnerGroup);
      const normalGroupIds = partnerGroupIds.filter(
        (id: string) => id !== nullUuidMap.partnerGroup,
      );

      qb.leftJoin(
        Partner,
        "debtAdjustmentPartnerFilter",
        `debtAdjustmentPartnerFilter.id = ${qb.alias}.partnerId`,
      );
      const groupConditions = [
        nullGroupSelected ? "debtAdjustmentPartnerFilter.groupId IS NULL" : "",
        normalGroupIds.length
          ? "debtAdjustmentPartnerFilter.groupId IN (:...debtAdjustmentPartnerGroupIds)"
          : "",
      ].filter(Boolean);
      qb.andWhere(`(${groupConditions.join(" OR ")})`, {
        debtAdjustmentPartnerGroupIds: normalGroupIds,
      });
    }
  }
}
