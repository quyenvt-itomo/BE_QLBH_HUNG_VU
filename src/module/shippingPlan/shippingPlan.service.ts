import type {
  RequestContext,
  ActionMap,
  ActionValue,
} from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ShippingPlanRepository } from "./shippingPlan.repository";
import { SHIPPING_PLAN_TYPES } from "./shippingPlan.types";
import { ShippingPlan } from "@/database/models/company/ShippingPlan";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { ApproveStatus } from "@/shared/constants/enum";
import { RejectShippingPlanDto } from "./shippingPlan.validator";
import { PARTNER_TYPES } from "@/module/partner/partner.types";
import { PartnerRepository } from "@/module/partner/partner.repository";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";
import { CalculationUtil } from "@/shared/utils/calculation.util";
import { NotificationService } from "@/module/notification/notification.service";
import { NOTIFICATION_TYPES } from "@/module/notification/notification.types";
import { NotificationType } from "@/database/models/Notification";

@injectable()
export class ShippingPlanService extends BaseService<ShippingPlan> {
  protected repository: ShippingPlanRepository;
  protected uniqueFields: (keyof ShippingPlan)[] = ["code"];
  protected uniqueScope?: (keyof ShippingPlan)[] = ["companyId"];
  protected searchableFields = ["code", "note"];

  constructor(
    @inject(SHIPPING_PLAN_TYPES.ShippingPlanRepository)
    repository: ShippingPlanRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
  ) {
    super();
    this.repository = repository;
  }

  async actionAfterCreate(
    data: ShippingPlan,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.notificationService.notifyApprovalPending(
      data,
      "shippingPlan",
      NotificationType.SHIPPING_PLAN,
    );
  }

  // ======================== ACTIONS ========================

  protected async attachActions(
    entity: ShippingPlan & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: ShippingPlan | null,
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

  async approve(id: string, req?: RequestContext): Promise<ShippingPlan> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const plan = await this.repository.findById(id, trxManager);
      if (!plan) throw new NotFoundError("Không tìm thấy phương án vận chuyển");

      const can = await this.canApprove(plan, req);
      if (!can.can) throw new BadRequestError(can.reason);

      const updateData: DeepPartial<ShippingPlan> = {
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
        "shippingPlan",
        NotificationType.SHIPPING_PLAN,
        (plan as any).creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  async reject(
    id: string,
    dto: RejectShippingPlanDto,
    req?: RequestContext,
  ): Promise<ShippingPlan> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const plan = await this.repository.findById(id, trxManager);
      if (!plan) throw new NotFoundError("Không tìm thấy phương án vận chuyển");

      const can = await this.canReject(plan, req);
      if (!can.can) throw new BadRequestError(can.reason);

      const updateData: DeepPartial<ShippingPlan> = {
        approveStatus: ApproveStatus.REJECTED,
        approvedAt: new Date(),
        approverId: employeeId ?? null,
        rejectReason: dto.rejectReason ?? null,
      };
      await this.employeeRepository.attachInfo(updateData, trxManager);

      const result = await this.repository.update(id, updateData, trxManager);
      if (!result) throw new BadRequestError("Từ chối thất bại");

      // Notification: báo cho người tạo phiếu biết đã bị từ chối
      await this.notificationService.notifyRejected(
        result,
        "shippingPlan",
        NotificationType.SHIPPING_PLAN,
        (plan as any).creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  // ======================== VALIDATE ========================

  async validateBeforeCreate(
    data: DeepPartial<ShippingPlan>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Populate partner snapshot
    await this.partnerRepository.attachInfo(data, manager);

    // Tính toán subTotal, taxAmount, totalAmount
    const calculationUtil = new CalculationUtil();
    const subTotal = calculationUtil.calculateSubTotal(data as any);
    const taxAmount = calculationUtil.calculateTaxAmount(data as any);
    const totalAmount = calculationUtil.calculateGrossAmount(data as any);

    data.subTotal = subTotal;
    data.taxAmount = taxAmount;
    data.totalAmount = totalAmount;
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<ShippingPlan>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const plan = await this.repository.getById(id, manager);
    const canUpdate = await this.canUpdate(plan, req);
    if (!canUpdate.can) {
      throw new BadRequestError(canUpdate.reason);
    }

    // Populate partner snapshot nếu có thay đổi
    if (data.partnerId) {
      await this.partnerRepository.attachInfo(data, manager);
    }

    // Tính toán lại nếu có thay đổi về giá/số lượng
    if (
      data.unitPrice !== undefined ||
      data.quantity !== undefined ||
      data.taxRate !== undefined
    ) {
      const calculationUtil = new CalculationUtil();
      const merged = { ...plan, ...data };
      data.subTotal = calculationUtil.calculateSubTotal(merged as any);
      data.taxAmount = calculationUtil.calculateTaxAmount(merged as any);
      data.totalAmount = calculationUtil.calculateGrossAmount(merged as any);
    }
  }

  // ======================== CAN CHECKS ========================

  async canUpdate(
    entity: ShippingPlan,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason:
          "Phương án vận chuyển đã được duyệt hoặc từ chối, không thể sửa",
      };
    }
    return { can: true };
  }

  async canDelete(
    entity: ShippingPlan,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason:
          "Phương án vận chuyển đã được duyệt hoặc từ chối, không thể xóa",
      };
    }
    return { can: true };
  }

  async canApprove(
    entity: ShippingPlan,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Phương án vận chuyển không ở trạng thái chờ duyệt",
      };
    }
    return { can: true };
  }

  async canReject(
    entity: ShippingPlan,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Phương án vận chuyển không ở trạng thái chờ duyệt",
      };
    }
    return { can: true };
  }

  async canCreateStockDocument(
    entity: ShippingPlan | string,
    _req?: RequestContext,
    moreConditions?: {
      purchaseId?: string;
      orderId?: string;
    },
  ): Promise<ActionValue> {
    const check = async (plan: ShippingPlan): Promise<ActionValue> => {
      if (plan.approveStatus !== ApproveStatus.APPROVED) {
        return {
          can: false,
          reason: "Phương án vận chuyển chưa được duyệt",
        };
      }

      if (
        moreConditions?.purchaseId &&
        plan.purchaseId !== moreConditions.purchaseId
      ) {
        return {
          can: false,
          reason: "Phương án vận chuyển không thuộc đơn mua hàng này",
        };
      }

      if (moreConditions?.orderId && plan.orderId !== moreConditions.orderId) {
        return {
          can: false,
          reason: "Phương án vận chuyển không thuộc đơn hàng này",
        };
      }

      return { can: true };
    };

    if (typeof entity === "string") {
      const plan = await this.repository.findOne({
        where: { id: entity },
      });

      if (!plan) {
        return {
          can: false,
          reason: "Không tìm thấy phương án vận chuyển",
        };
      }

      return check(plan);
    }

    return check(entity);
  }
}
