import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import {
  Partner,
  PartnerSnapshot,
  PartnerType,
} from "@/database/models/company/Partner";
import { PartnerContact } from "@/database/models/company/PartnerContact";
import { PartnerSelectFull, PartnerRelations } from "./partner.select";
import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { PartnerQueryDto } from "./partner.validator";
import { PARTNER_CONTACT_TYPES } from "../partnerContact/partnerContact.types";
import { PartnerContactRepository } from "../partnerContact/partnerContact.repository";

/**
 * Partner Repository
 */
@injectable()
export class PartnerRepository extends BaseRepository<Partner> {
  protected entityClass = Partner;
  protected selectedFields = PartnerSelectFull;
  protected relations = PartnerRelations;

  constructor(
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    private partnerContactRepository: PartnerContactRepository,
  ) {
    super();
  }

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Partner>,
    options: IFindPaginationOptions<Partner>,
  ): Promise<void> {
    const alias = qb.alias;
    const { type, groupId } = (options?.moreQuery as PartnerQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.types ? :type`, { type });
    }
    if (groupId) {
      qb.andWhere(`${alias}.groupId = :groupId`, { groupId });
    }
  }

  async findByTaxCode(
    taxCode: string,
    companyId: string,
    manager?: EntityManager,
  ): Promise<Partner | null> {
    return this.findOne({ where: { taxCode, companyId } as any }, manager);
  }

  async attachInfo<
    T extends {
      supplierId?: string | null;
      supplierSnapshot?: DeepPartial<PartnerSnapshot> | null;
      customerId?: string | null;
      customerSnapshot?: DeepPartial<PartnerSnapshot> | null;
      shippingProviderId?: string | null;
      shippingProviderSnapshot?: DeepPartial<PartnerSnapshot> | null;
      partnerId?: string | null;
      partnerSnapshot?: DeepPartial<PartnerSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    // supplierId → supplierSnapshot
    if (
      data.supplierId &&
      (!data.supplierSnapshot || data.supplierSnapshot.id !== data.supplierId)
    )
      data.supplierSnapshot = await this.getSnapshot(data.supplierId, manager);

    // customerId → customerSnapshot
    if (
      data.customerId &&
      (!data.customerSnapshot || data.customerSnapshot.id !== data.customerId)
    )
      data.customerSnapshot = await this.getSnapshot(data.customerId, manager);

    // shippingProviderId → shippingProviderSnapshot
    if (
      data.shippingProviderId &&
      (!data.shippingProviderSnapshot ||
        data.shippingProviderSnapshot.id !== data.shippingProviderId)
    )
      data.shippingProviderSnapshot = await this.getSnapshot(
        data.shippingProviderId,
        manager,
      );

    // partnerId → partnerSnapshot
    if (
      data.partnerId &&
      (!data.partnerSnapshot || data.partnerSnapshot.id !== data.partnerId)
    )
      data.partnerSnapshot = await this.getSnapshot(data.partnerId, manager);
  }

  async getSnapshot(
    partnerId: string,
    manager?: EntityManager,
  ): Promise<PartnerSnapshot | null> {
    const partner = await this.findById(partnerId, manager);
    if (!partner) return null;
    return {
      id: partner.id,
      name: partner.name,
      code: partner.code,
      taxCode: partner.taxCode,
      types: partner.types,
      email: partner.email,
      phone: partner.phone,
      address: partner.address,
      representative: partner.representative,
    };
  }

  getContactRepository(manager?: EntityManager) {
    return (manager || this.getRepository().manager).getRepository(
      PartnerContact,
    );
  }

  /**
   * Đảm bảo Partner và PartnerContact tồn tại từ snapshot.
   * Xử lý cả 3 case:
   * 1. Chưa có partner → tạo partner + contact cùng lúc (cascade)
   * 2. Có partner, chưa có contact → bổ sung type (nếu thiếu), tạo contact
   * 3. Có partner, có contact → chỉ bổ sung type (nếu thiếu)
   *
   * @returns { partnerId, contactId } — contactId có thể null nếu không có contactSnapshot
   */
  async ensurePartnerWithContact(
    partnerSnapshot: Partial<PartnerSnapshot> | null | undefined,
    contactSnapshot:
      | Partial<{
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
        }>
      | null
      | undefined,
    companyId: string,
    partnerType: PartnerType,
    manager?: EntityManager,
  ): Promise<{ partnerId: string; contactId: string | null }> {
    const tax = partnerSnapshot?.taxCode;
    const hasContactSnapshot = !!contactSnapshot?.name;

    // --- Tìm partner theo taxCode ---
    let partner: Partner | null = null;
    if (tax) {
      partner = await this.findByTaxCode(tax, companyId, manager);
    }

    // --- CASE 1: Chưa có partner → tạo partner + contact cùng lúc ---
    if (!partner) {
      const createData: DeepPartial<Partner> = {
        name: partnerSnapshot?.name || "",
        taxCode: tax || null,
        address: partnerSnapshot?.address || null,
        email: partnerSnapshot?.email || null,
        phone: partnerSnapshot?.phone || null,
        types: [partnerType],
        companyId,
      };

      if (hasContactSnapshot) {
        createData.contacts = [
          {
            name: contactSnapshot!.name || "",
            phone: contactSnapshot!.phone || null,
            email: contactSnapshot!.email || null,
          },
        ];
      }

      partner = await this.create(createData, manager);
      const savedContact = partner.contacts?.[0] || null;

      return {
        partnerId: partner.id,
        contactId: savedContact?.id || null,
      };
    }

    // --- CASE 2 & 3: Partner đã tồn tại ---
    // Bổ sung type nếu thiếu
    if (!partner.types?.includes(partnerType)) {
      await this.update(
        partner.id,
        { types: [...(partner.types || []), partnerType] },
        manager,
      );
    }

    // Tìm hoặc tạo contact
    let contact: PartnerContact | null = null;
    if (hasContactSnapshot) {
      const phone = contactSnapshot!.phone;
      if (phone) {
        contact = await this.partnerContactRepository.findOne({
          where: { phone, partnerId: partner.id },
        });
      }

      if (!contact) {
        contact = await this.partnerContactRepository.create({
          partnerId: partner.id,
          name: contactSnapshot!.name || "",
          phone: phone || null,
          email: contactSnapshot!.email || null,
        });
      }
    }

    return {
      partnerId: partner.id,
      contactId: contact?.id || null,
    };
  }

  /**
   * Đảm bảo Partner tồn tại từ snapshot (không kèm contact).
   * Tìm theo taxCode trước, nếu không có thì tạo mới.
   * Nếu đã tồn tại nhưng thiếu type thì bổ sung type.
   */
  async ensureFromSnapshot(
    snapshot: Partial<PartnerSnapshot> | null | undefined,
    companyId: string,
    partnerType: PartnerType,
    manager?: EntityManager,
  ): Promise<Partner | null> {
    if (!snapshot?.name) return null;

    const result = await this.ensurePartnerWithContact(
      snapshot,
      null,
      companyId,
      partnerType,
      manager,
    );

    return this.findById(result.partnerId, manager);
  }
}
