import { Brackets } from "typeorm";
import { injectable } from "inversify";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Partner, PartnerSnapshot, PartnerType } from "@/database/models";
import { PartnerSelectFull, PartnerRelations } from "./partner.select";

/**
 * Partner Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class PartnerRepository extends BaseRepository<Partner> {
  protected entityClass = Partner;
  protected selectedFields = PartnerSelectFull;
  protected relations = PartnerRelations;

  async getPartnerSnapshot(partnerId: string): Promise<PartnerSnapshot | null> {
    const partner = await this.findById(partnerId);

    if (!partner) return null;

    return {
      id: partner.id,
      name: partner.name,
      code: partner.code,
      type: partner.type,
      addresses: partner.addresses,
      email: partner.email,
      phone: partner.phone,
      representative: partner.representative,
      banks: partner.banks,
      groupId: partner.groupId,
      isOrganization: partner.isOrganization,
      taxCode: partner.taxCode,
    };
  }
}
