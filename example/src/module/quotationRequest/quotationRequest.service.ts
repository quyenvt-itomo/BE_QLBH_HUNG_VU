import type {
  RequestContext,
  ActionMap,
  ActionValue,
} from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { QuotationRequestRepository } from "./quotationRequest.repository";
import { QUOTATION_REQUEST_TYPES } from "./quotationRequest.types";
import { QuotationRequest } from "@/database/models/company/QuotationRequest";
import { QuotationRequestLine } from "@/database/models/company/QuotationRequestLine";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { ApproveStatus } from "@/shared/constants/enum";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { PartnerType } from "@/database/models/company/Partner";
import { NotificationService } from "@/module/notification/notification.service";
import { NOTIFICATION_TYPES } from "@/module/notification/notification.types";
import { ActionType, NotificationType } from "@/database/models/Notification";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";
import { PRODUCT_TYPES } from "@/module/product/product.types";
import { ProductRepository } from "@/module/product/product.repository";
import { ATTRIBUTE_TYPES } from "@/module/attribute/attribute.types";
import { AttributeRepository } from "@/module/attribute/attribute.repository";
import { PARTNER_TYPES } from "@/module/partner/partner.types";
import { PartnerRepository } from "@/module/partner/partner.repository";
import { PartnerContactRepository } from "@/module/partnerContact/partnerContact.repository";
import { PARTNER_CONTACT_TYPES } from "@/module/partnerContact/partnerContact.types";

@injectable()
export class QuotationRequestService extends BaseService<QuotationRequest> {
  protected repository: QuotationRequestRepository;
  protected uniqueFields: (keyof QuotationRequest)[] = ["code"];
  protected uniqueScope?: (keyof QuotationRequest)[] = ["storeId"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof QuotationRequest = "timeAt";

  constructor(
    @inject(QUOTATION_REQUEST_TYPES.QuotationRequestRepository)
    repository: QuotationRequestRepository,
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

  async lockReferralCode(
    quotationRequestId: string,
    manager?: EntityManager,
  ): Promise<QuotationRequest | null> {
    return await this.repository.update(
      quotationRequestId,
      { isLock: true },
      manager,
    );
  }

  async validateBeforeCreate(
    data: DeepPartial<QuotationRequest>,
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
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<QuotationRequest>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const qr = await this.repository.getById(id, manager);
    const canUpdate = await this.canUpdate(qr, req);
    if (!canUpdate.can) throw new BadRequestError(canUpdate.reason);
  }

  async validateBeforeDelete(
    data: QuotationRequest,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const canDelete = await this.canDelete(data, req);
    if (!canDelete.can) throw new BadRequestError(canDelete.reason);
  }

  async actionAfterCreate(
    data: QuotationRequest,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.notificationService.notifyApprovalPending(
      data,
      "quotationRequest",
      NotificationType.QUOTATION_REQUEST,
    );
    await this.notificationService.notifyUsersWithReadPermission(
      data,
      "quotationRequest",
      NotificationType.QUOTATION_REQUEST,
      ActionType.CREATE,
    );
  }

  async update(
    id: string,
    data: DeepPartial<QuotationRequest>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<QuotationRequest | null> {
    const { lines, ...safeData } = data;
    const result = await super.update(
      id,
      safeData as DeepPartial<QuotationRequest>,
      manager,
      req,
    );
    if (lines !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const lineRepo = trxManager.getRepository(QuotationRequestLine);
        const existing = await lineRepo.find({
          where: { quotationRequestId: id },
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
          quotationRequestId: id,
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
    entity: QuotationRequest & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: QuotationRequest | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    actions.approve = await this.canApprove(entity, req);
    actions.reject = await this.canReject(entity, req);
    actions.createQuotation = await this.canCreateQuotation(entity, req);
    return actions;
  }

  // ======================== APPROVE ========================

  async approve(
    id: string,
    createPartner: boolean,
    req?: RequestContext,
  ): Promise<QuotationRequest> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const qr = await this.repository.getById(id, trxManager);

      const can = await this.canApprove(qr, req);
      if (!can.can) throw new BadRequestError(can.reason);

      // Tạo/link khách hàng (Partner) & người liên hệ (PartnerContact) như purchaseQuotation
      let customerId = qr.customerId;
      let requesterId = qr.requesterId;

      if (createPartner && qr.customerSnapshot) {
        const { partnerId, contactId } =
          await this.partnerRepository.ensurePartnerWithContact(
            qr.customerSnapshot,
            qr.requesterSnapshot,
            qr.storeId,
            PartnerType.CUSTOMER,
            trxManager,
          );
        if (partnerId) customerId = partnerId;
        if (contactId) requesterId = contactId;
      } else if (qr.customerId && qr.requesterSnapshot?.name) {
        // Không tạo/đổi partner, chỉ đảm bảo lưu người liên hệ cho khách hàng đang có
        const phone = qr.requesterSnapshot.phone;
        let contact = phone
          ? await this.partnerContactRepository.findOne({
              where: { phone, partnerId: qr.customerId },
            })
          : null;
        if (!contact) {
          contact = await this.partnerContactRepository.create({
            partnerId: qr.customerId,
            name: qr.requesterSnapshot.name,
            phone: phone || null,
            email: qr.requesterSnapshot.email || null,
          });
        }
        requesterId = contact.id;
      }

      const updateData: DeepPartial<QuotationRequest> = {
        customerId,
        requesterId,
        approveStatus: ApproveStatus.APPROVED,
        approvedAt: new Date(),
        approverId: employeeId ?? null,
      };
      await this.employeeRepository.attachInfo(updateData, trxManager);

      const result = await this.repository.update(id, updateData, trxManager);
      if (!result) throw new BadRequestError("Phê duyệt thất bại");

      // Notification: báo cho người tạo phiếu biết đã được duyệt
      await this.notificationService.notifyApproved(
        result,
        "quotationRequest",
        NotificationType.QUOTATION_REQUEST,
        qr.creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  async reject(
    id: string,
    rejectReason: string | undefined,
    req?: RequestContext,
  ): Promise<QuotationRequest> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const qr = await this.repository.getById(id, trxManager);

      const can = await this.canReject(qr, req);
      if (!can.can) throw new BadRequestError(can.reason);

      const updateData: DeepPartial<QuotationRequest> = {
        approveStatus: ApproveStatus.REJECTED,
        approvedAt: new Date(),
        approverId: employeeId ?? null,
        rejectReason: rejectReason ?? null,
      };
      await this.employeeRepository.attachInfo(updateData, trxManager);

      const result = await this.repository.update(id, updateData, trxManager);
      if (!result) throw new BadRequestError("Từ chối thất bại");

      // Notification: báo cho người tạo phiếu biết đã bị từ chối
      await this.notificationService.notifyRejected(
        result,
        "quotationRequest",
        NotificationType.QUOTATION_REQUEST,
        qr.creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  async getByCode(
    code: string,
    req?: RequestContext,
  ): Promise<QuotationRequest> {
    const qr = await this.repository.findOne({ where: { code } }, undefined);
    if (!qr) throw new NotFoundError("Không tìm thấy đề nghị báo giá");
    return qr;
  }

  // ======================== CAN CHECKS ========================

  async canUpdate(
    entity: QuotationRequest,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    return { can: false, reason: "Không thể chỉnh sửa đề nghị báo giá" };
  }

  async canDelete(
    entity: QuotationRequest,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Đề nghị báo giá đã được duyệt hoặc từ chối, không thể xóa",
      };
    }
    return { can: true };
  }

  async canApprove(
    entity: QuotationRequest,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Đề nghị báo giá không ở trạng thái chờ duyệt",
      };
    }
    return { can: true };
  }

  async canReject(
    entity: QuotationRequest,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Đề nghị báo giá không ở trạng thái chờ duyệt",
      };
    }
    return { can: true };
  }

  /**
   * Kiểm tra xem có thể tạo báo giá từ đề nghị báo giá này không.
   * Chỉ được tạo khi đề nghị đã được duyệt và chưa có báo giá nào được khách hàng duyệt.
   */
  async canCreateQuotation(
    entity: QuotationRequest | string,
    req?: RequestContext,
  ): Promise<ActionValue> {
    const qr =
      typeof entity === "string"
        ? await this.repository.findById(entity)
        : entity;
    if (!qr) return { can: false, reason: "Không tìm thấy đề nghị báo giá" };

    if (qr.approveStatus !== ApproveStatus.APPROVED) {
      return {
        can: false,
        reason: "Đề nghị báo giá chưa được duyệt",
      };
    }

    if (qr.isLock) {
      return {
        can: false,
        reason:
          "Đề nghị báo giá đã có một báo giá được khác hàng duyệt, không thể tạo thêm báo giá mới",
      };
    }

    return { can: true };
  }
}
