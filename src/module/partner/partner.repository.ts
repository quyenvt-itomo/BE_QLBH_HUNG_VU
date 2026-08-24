import {
  Brackets,
  DeepPartial,
  EntityManager,
  SelectQueryBuilder,
} from "typeorm";
import { injectable } from "inversify";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Partner, PartnerSnapshot } from "@/database/models";
import {
  PartnerSelectFull,
  PartnerSelectList,
  PartnerRelations,
  PartnerRelationsList,
} from "./partner.select";
import { PartnerQueryDto } from "./partner.validator";

/**
 * Partner Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class PartnerRepository extends BaseRepository<Partner> {
  protected entityClass = Partner;
  protected selectedFields = PartnerSelectFull;
  protected selectedFieldsForList = PartnerSelectList;
  protected relations = PartnerRelations;
  protected relationsForList = PartnerRelationsList;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Partner>,
    options: IFindPaginationOptions<Partner>,
  ): Promise<void> {
    const alias = qb.alias;
    const {
      isOrganization,

      supplierGroupId,
      supplierGroupIds,
      customerGroupId,
      customerGroupIds,
      shipperGroupId,
      shipperGroupIds,
    } = (options.moreQuery as PartnerQueryDto) || {};

    const groupId = supplierGroupId || customerGroupId || shipperGroupId;

    const groupIds = [
      ...(supplierGroupIds || []),
      ...(customerGroupIds || []),
      ...(shipperGroupIds || []),
    ];

    if (groupId) {
      qb.andWhere(`${alias}.groupId = :groupId`, { groupId });
    } else if (this.checkArrayFilter(groupIds)) {
      qb.andWhere(`${alias}.groupId IN (:...groupIds)`, {
        groupIds,
      });
    }

    if (isOrganization !== undefined) {
      qb.andWhere(`${alias}.isOrganization = :isOrganization`, {
        isOrganization,
      });
    }
  }

  async getSnapshot(
    id: string,
    manager?: EntityManager,
  ): Promise<PartnerSnapshot | null> {
    const partner = await this.getRepository(manager).findOne({
      where: { id, deletedAt: null } as any,
    });
    return partner
      ? {
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
        }
      : null;
  }

  async attachInfo<
    T extends {
      supplierId?: string | null;
      supplierSnapshot?: DeepPartial<PartnerSnapshot> | null;
      customerId?: string | null;
      customerSnapshot?: DeepPartial<PartnerSnapshot> | null;
      shipperId?: string | null;
      shipperSnapshot?: DeepPartial<PartnerSnapshot> | null;
      partnerId?: string | null;
      partnerSnapshot?: DeepPartial<PartnerSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    for (const [idKey, snapshotKey] of [
      ["supplierId", "supplierSnapshot"],
      ["customerId", "customerSnapshot"],
      ["shipperId", "shipperSnapshot"],
      ["partnerId", "partnerSnapshot"],
    ] as const) {
      const id = data[idKey];
      const snapshot = data[snapshotKey];
      if (id && (!snapshot || snapshot.id !== id))
        (data as any)[snapshotKey] = await this.getSnapshot(id, manager);
    }
  }
}
