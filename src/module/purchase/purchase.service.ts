import type {
  RequestContext,
  ActionMap,
  ActionValue,
} from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PurchaseRepository } from "./purchase.repository";
import { PURCHASE_TYPES } from "./purchase.types";
import { Purchase } from "@/database/models/company/Purchase";
import { PurchaseLine } from "@/database/models/company/PurchaseLine";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { ApproveStatus } from "@/shared/constants/enum";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { InvoiceStatus } from "@/database/models/company/Invoice";
import { PARTNER_TYPES } from "@/module/partner/partner.types";
import { PartnerRepository } from "@/module/partner/partner.repository";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";
import { PRODUCT_TYPES } from "@/module/product/product.types";
import { ProductRepository } from "@/module/product/product.repository";
import { ProductService } from "@/module/product/product.service";
import { ATTRIBUTE_TYPES } from "@/module/attribute/attribute.types";
import { AttributeRepository } from "@/module/attribute/attribute.repository";
import { PURCHASE_LINE_TYPES } from "@/module/purchaseLine/purchaseLine.types";
import { PurchaseLineRepository } from "@/module/purchaseLine/purchaseLine.repository";
import { CalculationUtil } from "@/shared/utils/calculation.util";
import { NotificationService } from "@/module/notification/notification.service";
import { NOTIFICATION_TYPES } from "@/module/notification/notification.types";
import { NotificationType } from "@/database/models/Notification";
import { StockDocumentLine } from "@/database/models/company/StockDocumentLine";
import {
  StockDocument,
  StockDocumentStatus,
} from "@/database/models/company/StockDocument";

@injectable()
export class PurchaseService extends BaseService<Purchase> {
  protected repository: PurchaseRepository;
  protected uniqueFields: (keyof Purchase)[] = ["code"];
  protected uniqueScope?: (keyof Purchase)[] = ["companyId"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof Purchase = "orderedAt";

  constructor(
    @inject(PURCHASE_TYPES.PurchaseRepository)
    repository: PurchaseRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(PRODUCT_TYPES.ProductService)
    private productService: ProductService,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
    @inject(PURCHASE_LINE_TYPES.PurchaseLineRepository)
    private purchaseLineRepository: PurchaseLineRepository,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Purchase>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Populate supplier snapshot
    await this.partnerRepository.attachInfo(data, manager);

    // Populate staff snapshot
    await this.employeeRepository.attachInfo(data, manager);

    // Populate snapshot cho từng line
    if (data.lines) {
      for (const line of data.lines) {
        await this.productRepository.attachInfo(line, manager);
        await this.attributeRepository.attachUnitInfo(line, manager);
        await this.productRepository.attachUnitConversion(line, manager);
      }
    }

    // Tính toán
    const calculationUtil = new CalculationUtil();
    const total = calculationUtil.calculateDocumentTotal(data.lines || [], {
      discountType: data.discountType as any,
      discountValue: data.discountValue,
      taxType: data.taxType as any,
      taxValue: data.taxValue,
    });
    data.subTotal = total.subTotal;
    data.discountAmount = total.discountAmount;
    data.taxType = total.taxType as any;
    data.taxValue = total.taxValue;
    data.taxAmount = total.taxAmount;
    data.totalAmount = total.grossAmount;
    data.totalCommissionAmount = total.totalCommissionAmount;
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Purchase>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const purchase = await this.repository.getById(id, manager);
    const canUpdate = await this.canUpdate(purchase, req);
    if (!canUpdate.can) {
      throw new BadRequestError(canUpdate.reason);
    }
  }

  async actionAfterCreate(
    data: Purchase,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const lines = await manager.getRepository(PurchaseLine).find({
      where: { purchaseId: data.id },
    });
    for (const line of lines) {
      if (line.productId && line.unitId) {
        await this.productService.applyPurchasePrice(
          line.productId,
          line.unitId,
          line.unitPrice,
          manager,
        );
      }
    }
    await this.notificationService.notifyApprovalPending(
      data,
      "purchase",
      NotificationType.PURCHASE,
    );
  }

  async update(
    id: string,
    data: DeepPartial<Purchase>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<Purchase | null> {
    const { lines, ...safeData } = data;
    // Strip relation objects (not FK) to avoid TypeORM issues

    const result = await super.update(
      id,
      safeData as DeepPartial<Purchase>,
      manager,
      req,
    );

    if (lines !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const lineRepo = trxManager.getRepository(PurchaseLine);
        const existing = await lineRepo.find({ where: { purchaseId: id } });
        const existingById = new Map(existing.map((line) => [line.id, line]));
        // Populate snapshots cho từng line
        for (const line of lines) {
          await this.productRepository.attachInfo(line, trxManager);
          await this.attributeRepository.attachUnitInfo(line, trxManager);
          const oldLine = line.id ? existingById.get(line.id) : undefined;
          if (oldLine) {
            if (
              (line.productId && line.productId !== oldLine.productId) ||
              (line.unitId && line.unitId !== oldLine.unitId)
            ) {
              throw new BadRequestError(
                "Không thể đổi hàng hóa hoặc đơn vị tính của dòng đã lưu; hãy hủy phiếu để tạo lại",
              );
            }
            line.conversionRateAtTime = oldLine.conversionRateAtTime;
          } else {
            await this.productRepository.attachUnitConversion(line, trxManager);
          }
        }

        // Tính toán lại totals
        const current = await trxManager.getRepository(Purchase).findOne({
          where: { id },
        });
        const calculationUtil = new CalculationUtil();
        const total = calculationUtil.calculateDocumentTotal(lines, {
          discountType: (safeData.discountType ?? current?.discountType) as any,
          discountValue: safeData.discountValue ?? current?.discountValue,
          taxType: (safeData.taxType ?? current?.taxType) as any,
          taxValue: safeData.taxValue ?? current?.taxValue,
        });
        await trxManager.getRepository(Purchase).update(id, {
          subTotal: total.subTotal,
          discountAmount: total.discountAmount,
          taxType: total.taxType as any,
          taxValue: total.taxValue,
          taxAmount: total.taxAmount,
          totalAmount: total.grossAmount,
          totalCommissionAmount: total.totalCommissionAmount,
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
          purchaseId: id,
          sortOrder: l.sortOrder || 10 * (i + 1),
        }));
        if (toSave.length > 0) {
          await lineRepo.save(toSave);
          for (const line of toSave) {
            if (line.productId && line.unitId) {
              await this.productService.applyPurchasePrice(
                line.productId,
                line.unitId,
                line.unitPrice,
                trxManager,
              );
            }
          }
        }
      };

      if (manager) {
        await run(manager);
      } else {
        await withTransaction(run);
      }
    }
    if (
      lines === undefined &&
      result &&
      ["discountType", "discountValue", "taxType", "taxValue"].some(
        (field) => (safeData as any)[field] !== undefined,
      )
    ) {
      const recalculate = async (trxManager: EntityManager) => {
        const current = await trxManager.getRepository(Purchase).findOne({
          where: { id },
          relations: { lines: true },
        });
        if (!current) return;
        const total = new CalculationUtil().calculateDocumentTotal(current.lines || [], {
          discountType: current.discountType as any,
          discountValue: current.discountValue,
          taxType: current.taxType as any,
          taxValue: current.taxValue,
        });
        await trxManager.getRepository(Purchase).update(id, {
          subTotal: total.subTotal,
          discountAmount: total.discountAmount,
          taxAmount: total.taxAmount,
          totalAmount: total.grossAmount,
        });
      };
      await withTransaction(recalculate);
    }

    return result;
  }
  /**
   * Tính lại tổng số lượng đã giao (deliveredQuantity) cho từng PurchaseLine
   * của một đơn mua.
   * deliveredQuantity = Σ(line.billingQuantity) của các phiếu (doc) status=COMPLETED
   * và chưa bị xóa (deletedAt IS NULL).
   */
  async recalculateLineDeliveryQuantities(
    purchaseId: string,
    manager: EntityManager,
  ): Promise<void> {
    const lines = await this.purchaseLineRepository.find({
      where: { purchaseId },
    });

    if (!lines.length) return;

    const deliveredByLine = new Map<string, number>();

    for (const line of lines) {
      const purchaseLineId = line.id;

      // Tính tổng deliveredQuantity từ TẤT CẢ các stock document line đã complete, chưa xóa
      const totalResult = await manager
        .getRepository(StockDocumentLine)
        .createQueryBuilder("line")
        .innerJoin(StockDocument, "doc", "doc.id = line.stockDocumentId")
        .select("COALESCE(SUM(line.billingQuantity), 0)", "total")
        .where("line.purchaseLineId = :purchaseLineId")
        .andWhere("line.deletedAt IS NULL")
        .andWhere("doc.status = :status")
        .andWhere("doc.deletedAt IS NULL")
        .setParameters({
          purchaseLineId,
          status: StockDocumentStatus.COMPLETED,
        })
        .getRawOne<{ total: string }>();

      const deliveredQuantity = Number(totalResult?.total) || 0;
      deliveredByLine.set(purchaseLineId, deliveredQuantity);

      const quantity = line.quantity || 0;

      // Hoa hồng thực tế theo lượng đã giao = commissionAmount * delivered/quantity
      const actualCommissionAmount =
        quantity > 0
          ? (line.commissionAmount * deliveredQuantity) / quantity
          : 0;

      await this.purchaseLineRepository.update(
        purchaseLineId,
        { deliveredQuantity, actualCommissionAmount },
        manager,
      );
    }

    // Đồng bộ totalActualCommissionAmount của đơn mua = tổng các dòng
    const sumResult = await manager
      .getRepository(PurchaseLine)
      .createQueryBuilder("pl")
      .select("COALESCE(SUM(pl.actualCommissionAmount), 0)", "total")
      .where("pl.purchaseId = :purchaseId")
      .setParameters({ purchaseId })
      .getRawOne<{ total: string }>();

    await manager.getRepository(Purchase).update(purchaseId, {
      totalActualCommissionAmount: Number(sumResult?.total) || 0,
    });

    // Nếu tất cả các line nằm trong 100 ± toleranceRate → tự động hoàn thành đơn
    const purchase = await manager
      .getRepository(Purchase)
      .findOne({ where: { id: purchaseId } });
    if (purchase && !purchase.isCompleted) {
      const toleranceRate = Number(purchase.toleranceRate) || 0;

      const allWithinTolerance = lines.every((line) => {
        const qty = line.quantity || 0;
        if (!qty) return true;
        const delivered = deliveredByLine.get(line.id) || 0;
        const ratio = (delivered / qty) * 100;
        return ratio >= 100 - toleranceRate && ratio <= 100 + toleranceRate;
      });

      if (allWithinTolerance) {
        // completedAt = ngày nhập kho cuối cùng trong các phiếu đã COMPLETED của đơn
        const latestImport = await manager
          .getRepository(StockDocument)
          .createQueryBuilder("doc")
          .select("MAX(doc.actualImportDate)", "completedAt")
          .where("doc.purchaseId = :purchaseId")
          .andWhere("doc.status = :status")
          .andWhere("doc.deletedAt IS NULL")
          .setParameters({
            purchaseId,
            status: StockDocumentStatus.COMPLETED,
          })
          .getRawOne<{ completedAt: string | null }>();

        await manager.getRepository(Purchase).update(purchaseId, {
          isCompleted: true,
          completedAt: latestImport?.completedAt
            ? new Date(latestImport.completedAt)
            : new Date(),
        });
      }
    }
  }

  // ======================== ACTIONS ========================

  protected async attachActions(
    entity: Purchase & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: Purchase | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    actions.approve = await this.canApprove(entity, req);
    actions.reject = await this.canReject(entity, req);
    actions.complete = await this.canComplete(entity, req);
    actions.createShippingPlan = await this.canCreateShippingPlan(entity, req);
    actions.createStockDocument = await this.canCreateStockDocument(
      entity,
      req,
    );
    actions.createInvoice = await this.canCreateInvoice(entity, req);
    return actions;
  }

  async approve(id: string, req: RequestContext): Promise<Purchase> {
    const employeeId = req.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const purchase = await this.repository.findById(id, trxManager);
      if (!purchase) throw new NotFoundError("Không tìm thấy đơn mua hàng");
      if (purchase.approveStatus !== ApproveStatus.PENDING) {
        throw new BadRequestError("Đơn mua hàng không ở trạng thái chờ duyệt");
      }

      const updateData: DeepPartial<Purchase> = {
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
        "purchase",
        NotificationType.PURCHASE,
        (purchase as any).creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  async reject(
    id: string,
    rejectReason: string | undefined,
    req: RequestContext,
  ): Promise<Purchase> {
    const employeeId = req.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const purchase = await this.repository.findById(id, trxManager);
      if (!purchase) throw new NotFoundError("Không tìm thấy đơn mua hàng");
      if (purchase.approveStatus !== ApproveStatus.PENDING) {
        throw new BadRequestError("Đơn mua hàng không ở trạng thái chờ duyệt");
      }

      const updateData: DeepPartial<Purchase> = {
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
        "purchase",
        NotificationType.PURCHASE,
        (purchase as any).creatorId,
        null,
        req?.userContext?.userId,
      );

      return result;
    });
  }

  /**
   * Complete purchase after checking tolerance rate
   * toleranceRate: allowed deviation % between ordered and actual received quantities
   * ratio = Î£(actualQty * conversionFactor) / Î£(orderedQty * conversionFactor)
   * must be within [(100 - toleranceRate)%, (100 + toleranceRate)%]
   */
  async complete(id: string, req: RequestContext): Promise<Purchase> {
    return withTransaction(async (trxManager) => {
      const purchase = await this.repository.findById(id, trxManager);
      if (!purchase) throw new NotFoundError("Không tìm thấy đơn mua hàng");

      const can = await this.canComplete(purchase, req);
      if (!can.can) throw new BadRequestError(can.reason);

      const result = await this.repository.update(
        id,
        { isCompleted: true, completedAt: new Date() },
        trxManager,
      );
      if (!result) throw new BadRequestError("Hoàn thành thất bại");
      return result;
    });
  }

  // ======================== CAN CHECKS ========================

  async canUpdate(
    entity: Purchase,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Đơn mua hàng đã được duyệt hoặc từ chối, không thể sửa",
      };
    }
    return { can: true };
  }

  async canDelete(
    entity: Purchase,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Đơn mua hàng đã được duyệt hoặc từ chối, không thể xóa",
      };
    }
    return { can: true };
  }

  async canApprove(
    entity: Purchase,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Đơn mua hàng không ở trạng thái chờ duyệt",
      };
    }
    return { can: true };
  }

  async canReject(
    entity: Purchase,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.PENDING) {
      return {
        can: false,
        reason: "Đơn mua hàng không ở trạng thái chờ duyệt",
      };
    }
    return { can: true };
  }

  async canComplete(
    entity: Purchase,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.APPROVED) {
      return {
        can: false,
        reason: "Chỉ có thể hoàn thành đơn mua hàng đã duyệt",
      };
    }
    if (entity.isCompleted) {
      return { can: false, reason: "Đơn mua hàng đã được hoàn thành" };
    }
    return { can: true };
  }

  /**
   * Kiểm tra xem có thể tạo phương án vận chuyển cho đơn mua này không.
   * Chỉ được tạo khi đơn đã được duyệt.
   */
  async canCreateShippingPlan(
    entity: Purchase,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.approveStatus !== ApproveStatus.APPROVED) {
      return {
        can: false,
        reason:
          "Đơn mua hàng chưa được duyệt, không thể tạo phương án vận chuyển",
      };
    }

    if (entity.isCompleted) {
      return {
        can: false,
        reason:
          "Đơn mua hàng đã được hoàn thành, không thể tạo phương án vận chuyển",
      };
    }

    return { can: true };
  }

  async canCreateStockDocument(
    entity: Purchase | string,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    const check = (data: Purchase): ActionValue => {
      if (data.approveStatus !== ApproveStatus.APPROVED) {
        return {
          can: false,
          reason: "Đơn mua hàng chưa được duyệt, không thể tạo phiếu nhập kho",
        };
      }

      if (data.isCompleted) {
        return {
          can: false,
          reason:
            "Đơn mua hàng đã được hoàn thành, không thể tạo phiếu nhập kho",
        };
      }

      return { can: true };
    };

    if (typeof entity === "string") {
      const purchase = await this.repository.findOne({
        where: { id: entity },
      });
      if (!purchase) {
        return {
          can: false,
          reason: "Không tìm thấy đơn mua hàng",
        };
      }
      return check(purchase);
    }

    return check(entity);
  }

  async canCreateInvoice(
    entity: Purchase,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (!entity.isCompleted) {
      return {
        can: false,
        reason: "Đơn mua hàng chưa hoàn thành, không thể nhập hóa đơn",
      };
    }

    if (entity.approveStatus !== ApproveStatus.APPROVED) {
      return {
        can: false,
        reason: "Đơn mua hàng chưa được duyệt, không thể nhập hóa đơn",
      };
    }

    // Nếu có một hóa đơn chưa bị hủy thì không thể nhập thêm hóa đơn
    const invoinces = entity.invoices || [];
    const hasActiveInvoice = invoinces.some(
      (inv) => inv.status !== InvoiceStatus.CANCELED,
    );
    if (hasActiveInvoice) {
      return {
        can: false,
        reason:
          "Đơn hàng này đã có hóa đơn có hiệu lực, không thể nhập thêm hóa đơn",
      };
    }

    return { can: true };
  }
}
