import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import {
  PartnerContact,
  PartnerContactSnapshot,
} from "@/database/models/company/PartnerContact";
import {
  PartnerContactSelectFull,
  PartnerContactRelations,
} from "./partnerContact.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { PartnerContactQueryDto } from "./partnerContact.validator";

@injectable()
export class PartnerContactRepository extends BaseRepository<PartnerContact> {
  protected entityClass = PartnerContact;
  protected selectedFields = PartnerContactSelectFull;
  protected relations = PartnerContactRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PartnerContact>,
    options: IFindPaginationOptions<PartnerContact>,
  ): Promise<void> {
    const alias = qb.alias;
    const { partnerId } = (options?.moreQuery as PartnerContactQueryDto) || {};
    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, { partnerId });
    }
  }
  async attachInfo<
    T extends {
      quoterId?: string | null;
      quoterSnapshot?: DeepPartial<PartnerContactSnapshot> | null;
      requesterId?: string | null;
      requesterSnapshot?: DeepPartial<PartnerContactSnapshot> | null;
      sellerId?: string | null;
      sellerSnapshot?: DeepPartial<PartnerContactSnapshot> | null;
      partnerContactId?: string | null;
      partnerContactSnapshot?: DeepPartial<PartnerContactSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    // quoterId → quoterSnapshot
    if (
      data.quoterId &&
      (!data.quoterSnapshot || data.quoterSnapshot.id !== data.quoterId)
    )
      data.quoterSnapshot = await this.getSnapshot(data.quoterId, manager);

    // requesterId → requesterSnapshot
    if (
      data.requesterId &&
      (!data.requesterSnapshot ||
        data.requesterSnapshot.id !== data.requesterId)
    )
      data.requesterSnapshot = await this.getSnapshot(
        data.requesterId,
        manager,
      );

    // sellerId → sellerSnapshot
    if (
      data.sellerId &&
      (!data.sellerSnapshot || data.sellerSnapshot.id !== data.sellerId)
    )
      data.sellerSnapshot = await this.getSnapshot(data.sellerId, manager);

    // partnerContactId → partnerContactSnapshot
    if (
      data.partnerContactId &&
      (!data.partnerContactSnapshot ||
        data.partnerContactSnapshot.id !== data.partnerContactId)
    )
      data.partnerContactSnapshot = await this.getSnapshot(
        data.partnerContactId,
        manager,
      );
  }

  async getSnapshot(
    id?: string | null,
    manager?: EntityManager,
  ): Promise<PartnerContactSnapshot | null> {
    if (!id) return null;
    const contact = await this.findById(id, manager);
    if (!contact) return null;
    return {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    };
  }

  /**
   * Đảm bảo PartnerContact tồn tại từ snapshot.
   * Tìm theo phone trong partner, nếu không có thì tạo mới.
   * Trả về contact đã được đảm bảo.
   */
  async ensureFromSnapshot(
    snapshot: Partial<PartnerContactSnapshot> | null | undefined,
    partnerId: string,
    manager?: EntityManager,
  ): Promise<PartnerContact | null> {
    if (!snapshot?.name || !partnerId) return null;

    const phone = snapshot.phone;

    // Tìm contact theo SĐT trong partner
    let contact: PartnerContact | null = null;
    if (phone) {
      contact = await this.findOne({ where: { phone, partnerId } }, manager);
    }

    if (!contact) {
      contact = await this.create(
        {
          partnerId,
          name: snapshot.name || "",
          phone: phone || null,
          email: snapshot.email || null,
        },
        manager,
      );
    }

    return contact;
  }
}
