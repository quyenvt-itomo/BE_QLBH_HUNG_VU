import type {
  RequestContext,
  ActionMap,
  ActionValue,
} from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { QuotationRepository } from "./quotation.repository";
import { QUOTATION_TYPES } from "./quotation.types";
import { Quotation } from "@/database/models/company/Quotation";
import { QuotationLine } from "@/database/models/company/QuotationLine";
import { QuotationCommission } from "@/database/models/company/QuotationCommission";
import { Order } from "@/database/models/company/Order";
import { OrderLine } from "@/database/models/company/OrderLine";
import { OrderCommission } from "@/database/models/company/OrderCommission";
import { OrderCommissionDetail } from "@/database/models/company/OrderCommissionDetail";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { ApproveStatus } from "@/shared/constants/enum";
import { BadRequestError } from "@/shared/types/errors";
import { NotificationService } from "@/module/notification/notification.service";
import { NOTIFICATION_TYPES } from "@/module/notification/notification.types";
import { NotificationType } from "@/database/models/Notification";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";
import { PARTNER_TYPES } from "@/module/partner/partner.types";
import { PartnerRepository } from "@/module/partner/partner.repository";
import { PRODUCT_TYPES } from "@/module/product/product.types";
import { ProductRepository } from "@/module/product/product.repository";
import { ATTRIBUTE_TYPES } from "@/module/attribute/attribute.types";
import { AttributeRepository } from "@/module/attribute/attribute.repository";
import {
  QUOTATION_REQUEST_TYPES,
  QuotationRequestService,
} from "@/module/quotationRequest";
import { ORDER_TYPES } from "../order/order.types";
import { OrderRepository } from "../order/order.repository";
import { CalculationUtil } from "@/shared/utils/calculation.util";
import { generateCode } from "@/shared/utils/code.utils";

@injectable()
export class QuotationService extends BaseService<Quotation> {
  protected repository: QuotationRepository;
  protected uniqueFields: (keyof Quotation)[] = ["code"];
  protected uniqueScope?: (keyof Quotation)[] = ["companyId"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof Quotation = "timeAt";

  constructor(
    @inject(QUOTATION_TYPES.QuotationRepository)
    repository: QuotationRepository,

    @inject(ORDER_TYPES.OrderRepository)
    private orderRepository: OrderRepository,

    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
    @inject(QUOTATION_REQUEST_TYPES.QuotationRequestService)
    private quotationRequestService: QuotationRequestService,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Quotation>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Cross-entity validation: nếu có quotationRequestId, kiểm tra đề nghị đã được duyệt
    if (data.quotationRequestId) {
      const canCreate = await this.quotationRequestService.canCreateQuotation(
        data.quotationRequestId,
        req,
      );
      if (!canCreate.can) throw new BadRequestError(canCreate.reason);
    }

    // Populate snapshots
    await this.partnerRepository.attachInfo(data, manager);
    await this.employeeRepository.attachInfo(data, manager);

    // Populate product + unit snapshots cho từng line
    if (data.lines) {
      for (const line of data.lines) {
        await this.productRepository.attachInfo(line, manager);
        await this.attributeRepository.attachUnitInfo(line, manager);
      }
    }

    // Tính toán
    const calculationUtil = new CalculationUtil();
  }

  async actionAfterCreate(
    data: Quotation,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.notificationService.notifyApprovalPending(
      data,
      "quotation",
      NotificationType.QUOTATION,
    );
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Quotation>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const quotation = await this.repository.getById(id, manager);
    const canUpdate = await this.canUpdate(quotation, req);
    if (!canUpdate.can) throw new BadRequestError(canUpdate.reason);
  }

  async update(
    id: string,
    data: DeepPartial<Quotation>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<Quotation | null> {
    const { lines, ...safeData } = data;
    const result = await super.update(
      id,
      safeData as DeepPartial<Quotation>,
      manager,
      req,
    );
    if (lines !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const lineRepo = trxManager.getRepository(QuotationLine);
        const existing = await lineRepo.find({
          where: { quotationId: id },
        });
        const incomingIds = new Set(lines.map((l) => l.id).filter(Boolean));
        const removedIds = existing
          .map((l) => l.id)
          .filter((lid) => !incomingIds.has(lid));
        if (removedIds.length > 0) {
          await lineRepo.softDelete(removedIds);
        }
        const toSave = lines.map((l, i) => ({
          ...l,
          quotationId: id,
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
    entity: Quotation & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: Quotation | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    actions.approve = await this.canApprove(entity, req);
    actions.reject = await this.canReject(entity, req);
    actions.customerApprove = await this.canCustomerApprove(entity, req);
    actions.customerReject = await this.canCustomerReject(entity, req);
    actions.createOrder = await this.canCreateOrder(entity, req);
    return actions;
  }

  // ======================== APPROVE ========================

  /**
   * Staff approves quotation (internal approval).
   * Does NOT reject other quotations — that happens at customerApprove.
   */
  async approve(id: string, req?: RequestContext): Promise<Quotation> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const quotation = await this.repository.getById(id, trxManager);

      const can = await this.canApprove(quotation, req);
      if (!can.can) throw new BadRequestError(can.reason);

      const updateData: DeepPartial<Quotation> = {
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
        "quotation",
        NotificationType.QUOTATION,
        (quotation as any).creatorId,
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
  ): Promise<Quotation> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const quotation = await this.repository.getById(id, trxManager);

      const can = await this.canReject(quotation, req);
      if (!can.can) throw new BadRequestError(can.reason);

      const updateData: DeepPartial<Quotation> = {
        approveStatus: ApproveStatus.REJECTED,
        approvedAt: new Date(),
        approverId: employeeId ?? null,
        rejectReason: rejectReason ?? null,
      };
      await this.employeeRepository.attachInfo(updateData, trxManager);

      const result = await this.repository.update(id, updateData, trxManager);
      if (!result) throw new BadRequestError("Từ chối thất bại");

      // Notification
      await this.notificationService.notifyRejected(
        result,
        "quotation",
        NotificationType.QUOTATION,
        quotation.creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  /**
   * Customer approves the quotation (done by staff on behalf of customer, or by OTP)
   * Auto-creates an Order from this quotation with lines & commissions via cascade save,
   * rejects all other PENDING quotations for the same QuotationRequest,
   * locks the source QuotationRequest to prevent more quotations.
   */
  async customerApprove(id: string, req?: RequestContext): Promise<Order> {
    return withTransaction(async (trxManager) => {
      const quotation = await this.repository.getById(id, trxManager);

      const can = await this.canCustomerApprove(quotation, req);
      if (!can.can) throw new BadRequestError(can.reason);

      // Update quotation status to CUSTOMER_APPROVED
      await this.repository.update(
        id,
        { approveStatus: ApproveStatus.CUSTOMER_APPROVED },
        trxManager,
      );

      // Lock: reject all other PENDING quotations for the same QuotationRequest
      if (quotation.quotationRequestId) {
        await this.repository.rejectOtherQuotationsWithSameQuotationRequestId(
          quotation,
          "Khách hàng đã duyệt một báo giá khác",
          trxManager,
        );
      }

      return this.createOrderFromQuotation(quotation, trxManager, req);
    });
  }

  async customerReject(
    id: string,
    rejectReason: string | undefined,
    req?: RequestContext,
  ): Promise<Quotation> {
    return withTransaction(async (trxManager) => {
      const quotation = await this.repository.getById(id, trxManager);

      const can = await this.canCustomerReject(quotation, req);
      if (!can.can) throw new BadRequestError(can.reason);

      const updateData: DeepPartial<Quotation> = {
        approveStatus: ApproveStatus.CUSTOMER_REJECTED,
        rejectReason: rejectReason ?? null,
      };

      const result = await this.repository.update(id, updateData, trxManager);
      if (!result) throw new BadRequestError("Từ chối thất bại");

      return result;
    });
  }

  // ======================== CAN CHECKS ========================

  async canUpdate(
    entity: Quotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (
      entity.approveStatus !== ApproveStatus.PENDING &&
      entity.approveStatus !== ApproveStatus.APPROVED
    ) {
      return {
        can: false,
        reason: "Không thể sửa báo giá đã hoàn thành hoặc từ chối",
      };
    }
    return { can: true };
  }

  async canDelete(
    entity: Quotation,
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
    entity: Quotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Báo giá không ở trạng thái chờ duyệt",
      };
    }
    return { can: true };
  }

  async canReject(
    entity: Quotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Báo giá không ở trạng thái chờ duyệt",
      };
    }
    return { can: true };
  }

  async canCustomerApprove(
    entity: Quotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.APPROVED) {
      return {
        can: false,
        reason: "Báo giá chưa được duyệt nội bộ",
      };
    }
    return { can: true };
  }

  async canCustomerReject(
    entity: Quotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.APPROVED) {
      return {
        can: false,
        reason: "Báo giá chưa được duyệt nội bộ",
      };
    }
    return { can: true };
  }

  /**
   * Kiểm tra xem có thể tạo đơn hàng từ báo giá này không.
   * Chỉ được tạo khi báo giá đã được duyệt nội bộ và chưa được khách hàng duyệt/từ chối.
   */
  async canCreateOrder(
    entity: Quotation,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.APPROVED) {
      return {
        can: false,
        reason: "Báo giá chưa được duyệt nội bộ",
      };
    }
    return { can: true };
  }

  // ======================== PRIVATE ========================

  /**
   * Tạo đơn hàng từ báo giá đã được khách hàng duyệt.
   * Copy toàn bộ dữ liệu: lines, commissions, commissionDetails.
   */
  private async createOrderFromQuotation(
    quotation: Quotation,
    trxManager: EntityManager,
    req?: RequestContext,
  ): Promise<Order> {
    const { userId, userSnapshot } = req?.userContext || {};

    // Load quotation với đầy đủ relations (lines, commissions, details)
    const fullQuotation = await trxManager.getRepository(Quotation).findOne({
      where: { id: quotation.id },
      relations: {
        lines: { commissionDetails: true },
        commissions: { details: true },
      },
    });

    if (!fullQuotation) throw new BadRequestError("Không tìm thấy báo giá");

    const quotationLines = fullQuotation.lines ?? [];
    const quotationCommissions = fullQuotation.commissions ?? [];

    // Tạo map: quotationLine.id → index (để sau này map sang orderLine)
    const lineIndexMap = new Map<string, number>();
    quotationLines.forEach((ql, i) => lineIndexMap.set(ql.id, i));

    // Tạo map: quotationCommission.id → index
    const commissionIndexMap = new Map<string, number>();
    quotationCommissions.forEach((qc, i) => commissionIndexMap.set(qc.id, i));

    // Chuẩn bị Order với lines & commissions (cascade)
    const orderRepo = trxManager.getRepository(Order);
    const order = orderRepo.create({
      code: await generateCode("order", fullQuotation.companyId),
      companyId: fullQuotation.companyId,
      quotationId: fullQuotation.id,

      customerId: fullQuotation.customerId,
      customerSnapshot: fullQuotation.customerSnapshot,

      staffId: fullQuotation.staffId,
      staffSnapshot: fullQuotation.staffSnapshot,

      meshSpecId: fullQuotation.meshSpecId,
      meshSpecSnapshot: fullQuotation.meshSpecSnapshot,

      additionalInfo: fullQuotation.additionalInfo ?? [],

      subTotal: fullQuotation.subTotal ?? 0,
      taxAmount: fullQuotation.taxAmount ?? 0,
      totalAmount: fullQuotation.totalAmount ?? 0,
      totalCommissionAmount: fullQuotation.totalCommissionAmount ?? 0,

      creatorId: userId ?? null,
      creatorSnapshot: userSnapshot ?? null,

      lines: quotationLines.map((ql, i) => ({
        quotationLineId: ql.id,
        type: ql.type,
        productId: ql.productId,
        productSnapshot: ql.productSnapshot,
        unitId: ql.unitId,
        unitSnapshot: ql.unitSnapshot,
        quantity: ql.quantity,
        unitPrice: ql.unitPrice,
        taxRate: ql.taxRate,
        subTotal: ql.subTotal,
        taxAmount: ql.taxAmount,
        grossAmount: ql.grossAmount,
        commissionAmount: ql.commissionAmount ?? 0,
        note: ql.note,
        sortOrder: ql.sortOrder || 10 * (i + 1),
      })),

      commissions: quotationCommissions.map((qc) => ({
        partnerContactId: qc.partnerContactId,
        partnerContactSnapshot: qc.partnerContactSnapshot,
        totalAmount: qc.totalAmount,
        details: (qc.details ?? []).map((qcd) => {
          // Sẽ map sang orderLineId sau khi order được save
          const lineIdx = lineIndexMap.get(qcd.quotationLineId);
          return trxManager.getRepository(OrderCommissionDetail).create({
            // orderLineId sẽ được gán sau khi save (dùng index tạm)
            totalAmount: qcd.totalAmount,
          } as any);
        }),
      })),
    } as DeepPartial<Order>);

    // Save Order — cascade tự save lines & commissions
    const savedOrder = await orderRepo.save(order);

    // Load lại order với lines & commissions đã có ID
    const savedWithRelations = await orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: { lines: true, commissions: true },
    });

    if (!savedWithRelations) return savedOrder;

    const savedLines = savedWithRelations.lines ?? [];
    const savedCommissions = savedWithRelations.commissions ?? [];

    // Tạo OrderCommissionDetails với ID đúng
    const detailRepo = trxManager.getRepository(OrderCommissionDetail);
    const detailsToSave: OrderCommissionDetail[] = [];

    for (const qc of quotationCommissions) {
      const savedCommission = savedCommissions.find(
        (sc) =>
          sc.partnerContactId === qc.partnerContactId &&
          Math.abs(sc.totalAmount - qc.totalAmount) < 0.01,
      );
      if (!savedCommission || !qc.details) continue;

      for (const qcd of qc.details) {
        const savedLine = savedLines.find(
          (sl) => sl.quotationLineId === qcd.quotationLineId,
        );
        if (!savedLine) continue;

        detailsToSave.push(
          detailRepo.create({
            orderCommissionId: savedCommission.id,
            orderLineId: savedLine.id,
            totalAmount: qcd.totalAmount,
          } as OrderCommissionDetail),
        );
      }
    }

    if (detailsToSave.length > 0) {
      await detailRepo.save(detailsToSave);
    }

    return savedOrder;
  }
}
