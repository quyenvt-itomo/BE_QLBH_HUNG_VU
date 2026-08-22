import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PurchaseQuotation } from "@/database/models/company/PurchaseQuotation";
import {
  PurchaseQuotationSelectFull,
  PurchaseQuotationSelectList,
  PurchaseQuotationRelations,
  PurchaseQuotationRelationsList,
  PurchaseQuotationRelationSelects,
  PurchaseQuotationRelationSelectsForList,
} from "./purchaseQuotation.select";
import { injectable } from "inversify";
import { SelectQueryBuilder, Not, EntityManager } from "typeorm";
import { PurchaseQuotationQueryDto } from "./purchaseQuotation.validator";
import { ApproveStatus } from "@/shared/constants/enum";

@injectable()
export class PurchaseQuotationRepository extends BaseRepository<PurchaseQuotation> {
  protected entityClass = PurchaseQuotation;
  protected selectedFields = PurchaseQuotationSelectFull;
  protected selectedFieldsForList = PurchaseQuotationSelectList;
  protected relations = PurchaseQuotationRelations;
  protected relationsForList = PurchaseQuotationRelationsList;
  protected relationSelects = PurchaseQuotationRelationSelects;
  protected relationSelectsForList = PurchaseQuotationRelationSelectsForList;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PurchaseQuotation>,
    options: IFindPaginationOptions<PurchaseQuotation>,
  ): Promise<void> {
    const alias = qb.alias;
    const { approveStatus, supplierId, staffId } =
      (options?.moreQuery as PurchaseQuotationQueryDto) || {};

    if (approveStatus) {
      qb.andWhere(`${alias}.approveStatus = :approveStatus`, { approveStatus });
    }
    if (supplierId) {
      qb.andWhere(`${alias}.supplierId = :supplierId`, { supplierId });
    }
    if (staffId) {
      qb.andWhere(`${alias}.staffId = :staffId`, { staffId });
    }
  }

  /**
   * Từ chối tất cả báo giá PENDING khác có cùng mã giới thiệu.
   * Dùng khi một báo giá được duyệt — các báo giá còn lại cùng referralCode
   * sẽ bị tự động từ chối với lý do "Đã có báo giá khác được duyệt trước".
   */
  async rejectOtherQuotationsWithSameReferralCode(
    pq: PurchaseQuotation,
    reason: string,
    manager?: EntityManager,
  ): Promise<void> {
    if (!pq.referralCodeId) return;
    const repo = this.getRepository(manager);
    await repo.update(
      {
        referralCodeId: pq.referralCodeId,
        id: Not(pq.id),
        approveStatus: ApproveStatus.PENDING,
      },
      {
        approveStatus: ApproveStatus.REJECTED,
        rejectReason: reason,
        approverId: pq.approverId,
        approverSnapshot: pq.approverSnapshot,
        approvedAt: pq.approvedAt,
      },
    );
  }
}
