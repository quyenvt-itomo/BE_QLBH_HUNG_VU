import type {
  RequestContext,
  ActionMap,
  ActionValue,
} from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PurchaseQuotationRepository } from "./purchaseQuotation.repository";
import { PURCHASE_QUOTATION_TYPES } from "./purchaseQuotation.types";
import {
  PurchaseQuotation,
  PurchaseQuotationType,
} from "@/database/models/company/PurchaseQuotation";
import { PurchaseQuotationLine } from "@/database/models/company/PurchaseQuotationLine";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { ApproveStatus } from "@/shared/constants/enum";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { REFERRAL_CODE_TYPES } from "@/module/referralCode/referralCode.types";
import { ReferralCodeService } from "@/module/referralCode/referralCode.service";
import { PARTNER_TYPES } from "@/module/partner/partner.types";
import { PartnerRepository } from "@/module/partner/partner.repository";
import { PartnerContactRepository } from "@/module/partnerContact/partnerContact.repository";
import { PARTNER_CONTACT_TYPES } from "@/module/partnerContact/partnerContact.types";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";
import { PRODUCT_TYPES } from "@/module/product/product.types";
import { ProductRepository } from "@/module/product/product.repository";
import { ATTRIBUTE_TYPES } from "@/module/attribute/attribute.types";
import { AttributeRepository } from "@/module/attribute/attribute.repository";
import { CalculationUtil } from "@/shared/utils/calculation.util";
import { Partner, PartnerType } from "@/database/models/company/Partner";
import { ApproveRejectDto } from "./purchaseQuotation.validator";
import { NotificationService } from "@/module/notification/notification.service";
import { NOTIFICATION_TYPES } from "@/module/notification/notification.types";
import { NotificationType } from "@/database/models/Notification";

@injectable()
export class PurchaseQuotationService extends BaseService<PurchaseQuotation> {
  protected repository: PurchaseQuotationRepository;
  protected uniqueFields: (keyof PurchaseQuotation)[] = ["code"];
  protected uniqueScope?: (keyof PurchaseQuotation)[] = ["companyId"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof PurchaseQuotation = "timeAt";

  constructor(
    @inject(PURCHASE_QUOTATION_TYPES.PurchaseQuotationRepository)
    repository: PurchaseQuotationRepository,
    @inject(REFERRAL_CODE_TYPES.ReferralCodeService)
    private referralCodeService: ReferralCodeService,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    private partnerContactRepository: PartnerContactRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
  ) {
    super();
    this.repository = repository;
  }

  // ======================== VALIDATE ========================
  async validateBeforeCreate(
    data: DeepPartial<PurchaseQuotation>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Populate snapshot
    await this.partnerRepository.attachInfo(data, manager);
    await this.partnerContactRepository.attachInfo(data, manager);
    await this.employeeRepository.attachInfo(data, manager);

    // Populate snapshot cho từng line
    if (data.lines) {
      for (const line of data.lines) {
        await this.productRepository.attachInfo(line, manager);
        await this.attributeRepository.attachUnitInfo(line, manager);
      }
    }

    // Validate referral code nếu có
    if (data.referralCodeId) {
      const ref = await this.referralCodeService.validateAndResolve(
        data.referralCodeId,
        data.companyId || req?.companyContext?.companyId || "",
        manager,
      );

      // Check nghiệp vụ riêng của báo giá: mã giới thiệu phải dành cho NCC này
      if (
        ref.partnerId &&
        data.supplierId &&
        ref.partnerId !== data.supplierId
      ) {
        throw new BadRequestError(
          "Mã giới thiệu không dành cho đơn vị của bạn, vui lòng liên hệ lại với người cung cấp.",
        );
      }

      data.type = PurchaseQuotationType.QUOTATION;
    } else {
      data.type = PurchaseQuotationType.OFFER;
    }

    // Tính toán
    const calculationUtil = new CalculationUtil();
    const total = calculationUtil.calculateTotalForArray(data.lines || []);
    data.subTotal = total.subTotal;
    data.taxAmount = total.taxAmount;
    data.totalAmount = total.grossAmount;
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<PurchaseQuotation>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const existing = await this.repository.getById(id, manager);
    const canUpdate = await this.canUpdate(existing, req);
    if (!canUpdate.can) throw new BadRequestError(canUpdate.reason);
  }

  async validateBeforeDelete(
    data: PurchaseQuotation,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const canDelete = await this.canDelete(data, req);
    if (!canDelete.can) throw new BadRequestError(canDelete.reason);
  }

  async actionAfterCreate(
    data: PurchaseQuotation,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Nếu có mã giới thiệu, đánh dấu đã sử dụng
    if (data.referralCodeId && data.supplierId) {
      await this.referralCodeService.bindToPartner(
        data.referralCodeId,
        data.supplierId,
        data.supplierSnapshot,
      );
    }

    await this.notificationService.notifyApprovalPending(
      data,
      "purchaseQuotation",
      NotificationType.PURCHASE_QUOTATION,
    );
  }

  async update(
    id: string,
    data: DeepPartial<PurchaseQuotation>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<PurchaseQuotation | null> {
    const { lines, ...safeData } = data;
    const result = await super.update(
      id,
      safeData as DeepPartial<PurchaseQuotation>,
      manager,
      req,
    );
    if (lines !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const lineRepo = trxManager.getRepository(PurchaseQuotationLine);
        const existing = await lineRepo.find({
          where: { purchaseQuotationId: id },
        });
        const incomingIds = new Set(
          lines.map((l: any) => l.id).filter(Boolean),
        );
        const removedIds = existing
          .map((l) => l.id)
          .filter((lid) => !incomingIds.has(lid));
        if (removedIds.length > 0) {
          await lineRepo.softDelete(removedIds);
        }
        const toSave = lines.map((l: any, i: number) => ({
          ...l,
          purchaseQuotationId: id,
          sortOrder: l.sortOrder || 10 * (i + 1),
        }));
        if (toSave.length > 0) {
          await lineRepo.save(toSave);
        }
      };
      if (manager) {
        await run(manager);
      } else {
        await withTransaction(run);
      }
    }
    return result;
  }

  // ======================== ACTIONS ========================

  protected async attachActions(
    entity: PurchaseQuotation & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: PurchaseQuotation | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    actions.approve = await this.canApprove(entity, req);
    actions.reject = await this.canReject(entity, req);
    actions.createPurchase = await this.canCreatePurchase(entity, req);
    return actions;
  }

  // ======================== APPROVE ========================

  async approve(id: string, req?: RequestContext): Promise<PurchaseQuotation> {
    const employeeId = req?.userContext?.employeeId;

    return withTransaction(async (trxManager) => {
      const pq = await this.repository.findById(id, trxManager);
      if (!pq) throw new NotFoundError("Không tìm thấy báo giá mua");

      const can = await this.canApprove(pq, req);
      if (!can.can) throw new BadRequestError(can.reason);

      const updateData: DeepPartial<PurchaseQuotation> = {
        approveStatus: ApproveStatus.APPROVED,
        approvedAt: new Date(),
        approverId: employeeId ?? null,
      };
      await this.employeeRepository.attachInfo(updateData, trxManager);

      // Đảm bảo supplier & quoter được lưu
      await this.ensureSupplierAndQuoter(pq, trxManager);

      // Bind referral code
      if (pq.referralCodeId && pq.supplierId) {
        const partner = await this.partnerRepository.findById(
          pq.supplierId,
          trxManager,
        );
        if (partner) {
          await this.referralCodeService.bindToPartner(
            pq.referralCodeId,
            partner.id,
            {
              id: partner.id,
              name: partner.name,
              code: partner.code,
              taxCode: partner.taxCode,
              types: partner.types,
            },
            true,
          );
        }
      }

      const result = await this.repository.update(id, updateData, trxManager);
      if (!result) throw new BadRequestError("Phê duyệt thất bại");

      // Notification: báo cho người tạo phiếu biết đã được duyệt
      await this.notificationService.notifyApproved(
        result,
        "purchaseQuotation",
        NotificationType.PURCHASE_QUOTATION,
        (pq as any).creatorId,
        null,
        req?.userContext?.userId,
      );

      // Nếu phê duyệt thành công thì từ chối các báo giá khác cùng mã giới thiệu (nếu có) với lý do "Đã có báo giá khác được duyệt trước"
      if (pq.referralCodeId) {
        await this.repository.rejectOtherQuotationsWithSameReferralCode(
          pq,
          "Đã có báo giá khác được duyệt trước",
          trxManager,
        );
        // Khóa mã giới thiệu để không thể dùng lại
        await this.referralCodeService.lockReferralCode(
          pq.referralCodeId,
          trxManager,
        );
      }

      return result;
    });
  }

  // ======================== REJECT ========================

  async reject(
    id: string,
    data: ApproveRejectDto,
    req?: RequestContext,
  ): Promise<PurchaseQuotation> {
    const employeeId = req?.userContext?.employeeId;

    return withTransaction(async (trxManager) => {
      const pq = await this.repository.findById(id, trxManager);
      if (!pq) throw new NotFoundError("Không tìm thấy báo giá mua");

      const can = await this.canReject(pq, req);
      if (!can.can) throw new BadRequestError(can.reason);

      // Nếu admin chọn lưu thông tin NCC
      if (data.submitInfo) {
        await this.ensureSupplierAndQuoter(pq, trxManager);
      }

      const updateData: DeepPartial<PurchaseQuotation> = {
        approveStatus: ApproveStatus.REJECTED,
        approvedAt: new Date(),
        approverId: employeeId ?? null,
        rejectReason: data.rejectReason ?? null,
      };
      await this.employeeRepository.attachInfo(updateData, trxManager);

      const result = await this.repository.update(id, updateData, trxManager);
      if (!result) throw new BadRequestError("Từ chối thất bại");

      // Notification: báo cho người tạo phiếu biết đã bị từ chối
      await this.notificationService.notifyRejected(
        result,
        "purchaseQuotation",
        NotificationType.PURCHASE_QUOTATION,
        (pq as any).creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  async getByCode(
    code: string,
    req?: RequestContext,
  ): Promise<PurchaseQuotation> {
    const pq = await this.repository.findOne({ where: { code } }, undefined);
    if (!pq) throw new NotFoundError("Không tìm thấy báo giá mua");
    return pq;
  }

  // ======================== HELPERS ========================

  /**
   * Đảm bảo supplier (Partner) và quoter (PartnerContact) tồn tại.
   * Sử dụng partnerRepository.ensurePartnerWithContact để xử lý cả 3 case:
   * 1. Chưa có partner → tạo partner + contact cùng lúc
   * 2. Có partner, chưa contact → bổ sung type, tạo contact
   * 3. Có cả partner & contact → chỉ bổ sung type nếu thiếu
   */
  private async ensureSupplierAndQuoter(
    pq: PurchaseQuotation,
    manager: EntityManager,
  ): Promise<void> {
    if (!pq.supplierSnapshot) return;

    const { partnerId, contactId } =
      await this.partnerRepository.ensurePartnerWithContact(
        pq.supplierSnapshot,
        pq.quoterSnapshot,
        pq.companyId,
        PartnerType.SUPPLIER,
        manager,
      );

    const update: DeepPartial<PurchaseQuotation> = {};
    if (!pq.supplierId && partnerId) update.supplierId = partnerId;
    if (!pq.quoterId && contactId) update.quoterId = contactId;

    if (Object.keys(update).length > 0) {
      await this.repository.update(pq.id, update, manager);
    }
  }

  // ======================== CAN CHECKS ========================

  async canUpdate(
    entity: PurchaseQuotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Báo giá đã được duyệt hoặc từ chối, không thể sửa",
      };
    }
    return { can: true };
  }

  async canDelete(
    entity: PurchaseQuotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Báo giá đã được duyệt hoặc từ chối, không thể xóa",
      };
    }
    return { can: true };
  }

  async canApprove(
    entity: PurchaseQuotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return { can: false, reason: "Báo giá không ở trạng thái chờ duyệt" };
    }
    return { can: true };
  }

  async canReject(
    entity: PurchaseQuotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return { can: false, reason: "Báo giá không ở trạng thái chờ duyệt" };
    }
    return { can: true };
  }

  async canCreatePurchase(
    entity: PurchaseQuotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.type === PurchaseQuotationType.OFFER) {
      return {
        can: false,
        reason: "Không thể tạo đơn mua từ phiếu chào giá",
      };
    }

    if (entity.approveStatus !== ApproveStatus.APPROVED) {
      return {
        can: false,
        reason: "Báo giá chưa được duyệt, không thể tạo đơn mua",
      };
    }

    return { can: true };
  }
}
