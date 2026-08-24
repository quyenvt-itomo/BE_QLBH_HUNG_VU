import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PartnerContact } from "@/database/models";
import {
  PartnerContactSelectFull,
  PartnerContactSelectList,
  PartnerContactRelations,
  PartnerContactRelationsList,
} from "./partnerContact.select";

/**
 * PartnerContact Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class PartnerContactRepository extends BaseRepository<PartnerContact> {
  protected entityClass = PartnerContact;
  protected selectedFields = PartnerContactSelectFull;
  protected selectedFieldsForList = PartnerContactSelectList;
  protected relations = PartnerContactRelations;
  protected relationsForList = PartnerContactRelationsList;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PartnerContact>,
    options: IFindPaginationOptions<PartnerContact>,
  ): Promise<void> {
    // giữ nguyên logic cha (nếu có)
    super.extendQueryBuilder?.(qb, options);

    // trong option có type thì phải lọc theo type của partner cha
    if (options.type !== undefined) {
      qb.innerJoin(
        "entity.partner",
        "partnerFilterByType",
        "partnerFilterByType.type = :type",
        { type: options.type },
      );
    }
  }

  async deletesByPartnerId(partnerId: string): Promise<void> {
    const repo = this.getRepository();
    await repo
      .createQueryBuilder()
      .delete()
      .from(PartnerContact)
      .where("partnerId = :partnerId", { partnerId })
      .execute();
  }
}
