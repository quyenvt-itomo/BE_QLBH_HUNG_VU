import type {
  RequestContext,
  ActionMap,
  ActionValue,
} from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PurchaseRequisitionRepository } from "./purchaseRequisition.repository";
import { PURCHASE_REQUISITION_TYPES } from "./purchaseRequisition.types";
import { PurchaseRequisition } from "@/database/models/company/PurchaseRequisition";
import { PurchaseRequisitionLine } from "@/database/models/company/PurchaseRequisitionLine";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { ApproveStatus } from "@/shared/constants/enum";
import { BadRequestError } from "@/shared/types/errors";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";
import {
  ORGANIZATION_TYPES,
  OrganizationRepository,
} from "@/module/organization";
import { PRODUCT_TYPES, ProductRepository } from "@/module/product";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/module/attribute";
import { NotificationService } from "@/module/notification/notification.service";
import { NOTIFICATION_TYPES } from "@/module/notification/notification.types";
import { NotificationType } from "@/database/models/Notification";

@injectable()
export class PurchaseRequisitionService extends BaseService<PurchaseRequisition> {
  protected repository: PurchaseRequisitionRepository;
  protected searchableFields = ["code"];
  protected timeField: keyof PurchaseRequisition = "timeAt";

  constructor(
    @inject(PURCHASE_REQUISITION_TYPES.PurchaseRequisitionRepository)
    repository: PurchaseRequisitionRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(ORGANIZATION_TYPES.OrganizationRepository)
    private organizationRepository: OrganizationRepository,
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

  async actionAfterCreate(
    data: PurchaseRequisition,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.notificationService.notifyApprovalPending(
      data,
      "purchaseRequisition",
      NotificationType.PURCHASE_REQUISITION,
    );
  }

  async validateBeforeCreate(
    data: DeepPartial<PurchaseRequisition>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.employeeRepository.attachInfo(data, manager);
    await this.organizationRepository.attachInfo(data, manager);

    // Populate snapshot cho từng line
    if (data.lines) {
      for (const line of data.lines) {
        await this.productRepository.attachInfo(line as any, manager);
        await this.attributeRepository.attachUnitInfo(line as any, manager);
      }
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<PurchaseRequisition>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.employeeRepository.attachInfo(data, manager);
    await this.organizationRepository.attachInfo(data, manager);
  }

  /**
   * Override update để xử lý lines (OneToMany) đúng cách.
   * Gọi super.update() cho entity chính (xử lý files, hooks),
   * sau đó sync lines riêng.
   */
  async update(
    id: string,
    data: DeepPartial<PurchaseRequisition>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<PurchaseRequisition | null> {
    const { lines, ...safeData } = data;

    // super.update() handles file activation + hooks
    const result = await super.update(
      id,
      safeData as DeepPartial<PurchaseRequisition>,
      manager,
      req,
    );

    // Sync lines nếu có
    if (lines !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const lineRepo = trxManager.getRepository(PurchaseRequisitionLine);
        const existing = await lineRepo.find({
          where: { purchaseRequisitionId: id },
        });

        const incomingIds = new Set(
          lines.map((l: any) => l.id).filter(Boolean),
        );

        // Soft-delete removed lines
        const removedIds = existing
          .map((l) => l.id)
          .filter((lid) => !incomingIds.has(lid));
        if (removedIds.length > 0) {
          await lineRepo.softDelete(removedIds);
        }

        // Save / update lines
        const toSave = lines.map((l: any, i: number) => ({
          ...l,
          purchaseRequisitionId: id,
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
    entity: PurchaseRequisition & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: PurchaseRequisition | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    actions.approve = await this.canApprove(entity, req);
    actions.reject = await this.canReject(entity, req);
    return actions;
  }

  // ======================== APPROVE / REJECT ========================

  async approve(
    id: string,
    req?: RequestContext,
  ): Promise<PurchaseRequisition> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const entity = await this.repository.getById(id, trxManager);

      if (entity.approveStatus !== ApproveStatus.PENDING) {
        throw new BadRequestError("Phiếu không ở trạng thái chờ duyệt");
      }

      const updateData: DeepPartial<PurchaseRequisition> = {
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
        "purchaseRequisition",
        NotificationType.PURCHASE_REQUISITION,
        (entity as any).creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  async reject(
    id: string,
    rejectReason: string,
    req?: RequestContext,
  ): Promise<PurchaseRequisition> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const entity = await this.repository.getById(id, trxManager);

      if (entity.approveStatus !== ApproveStatus.PENDING) {
        throw new BadRequestError("Phiếu không ở trạng thái chờ duyệt");
      }

      const updateData: DeepPartial<PurchaseRequisition> = {
        approveStatus: ApproveStatus.REJECTED,
        approvedAt: new Date(),
        rejectReason,
        approverId: employeeId ?? null,
      };
      await this.employeeRepository.attachInfo(updateData, trxManager);

      const result = await this.repository.update(id, updateData, trxManager);

      if (!result) throw new BadRequestError("Từ chối thất bại");

      // Notification: báo cho người tạo phiếu biết đã bị từ chối
      await this.notificationService.notifyRejected(
        result,
        "purchaseRequisition",
        NotificationType.PURCHASE_REQUISITION,
        (entity as any).creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  async canUpdate(
    entity: PurchaseRequisition,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Phiếu đã được duyệt hoặc từ chối, không thể sửa",
      };
    }
    return { can: true };
  }

  async canDelete(
    entity: PurchaseRequisition,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Phiếu đã được duyệt hoặc từ chối, không thể xóa",
      };
    }
    return { can: true };
  }

  async canApprove(
    entity: PurchaseRequisition,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Phiếu đã được duyệt hoặc từ chối, không thể duyệt",
      };
    }
    return { can: true };
  }

  async canReject(
    entity: PurchaseRequisition,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Phiếu đã được duyệt hoặc từ chối, không thể từ chối",
      };
    }
    return { can: true };
  }

  /**
   * Kiểm tra xem có thể tạo mã giới thiệu từ đề nghị mua này không.
   * Chỉ được tạo khi đề nghị đã được duyệt.
   */
  async canCreateReferralCode(
    entity: PurchaseRequisition | string,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    const check = async (pr: PurchaseRequisition): Promise<ActionValue> => {
      if (pr.approveStatus !== ApproveStatus.APPROVED) {
        return {
          can: false,
          reason:
            "Đề nghị mua vật tư chưa được duyệt, không thể tạo mã giới thiệu",
        };
      }
      return { can: true };
    };

    if (typeof entity === "string") {
      const pr = await this.repository.findById(entity);
      if (!pr) {
        return { can: false, reason: "Không tìm thấy đề nghị mua vật tư" };
      }

      return check(pr);
    }
    return check(entity);
  }
}
