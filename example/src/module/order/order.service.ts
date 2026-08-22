import type {
  RequestContext,
  ActionMap,
  ActionValue,
} from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { OrderRepository } from "./order.repository";
import { ORDER_TYPES } from "./order.types";
import { Order } from "@/database/models/company/Order";
import { OrderLine } from "@/database/models/company/OrderLine";
import {
  StockDocument,
  StockDocumentStatus,
} from "@/database/models/company/StockDocument";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { NotificationService } from "@/module/notification/notification.service";
import { NOTIFICATION_TYPES } from "@/module/notification/notification.types";
import { NotificationType, ActionType } from "@/database/models/Notification";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";
import { PARTNER_TYPES } from "@/module/partner/partner.types";
import { PartnerRepository } from "@/module/partner/partner.repository";
import { PRODUCT_TYPES } from "@/module/product/product.types";
import { ProductRepository } from "@/module/product/product.repository";
import { ATTRIBUTE_TYPES } from "@/module/attribute/attribute.types";
import { AttributeRepository } from "@/module/attribute/attribute.repository";
import { StockDocumentLine } from "@/database/models/company/StockDocumentLine";
import { ORDER_LINE_TYPES } from "../orderLine/orderLine.types";
import { OrderLineRepository } from "../orderLine/orderLine.repository";

@injectable()
export class OrderService extends BaseService<Order> {
  protected repository: OrderRepository;
  protected uniqueFields: (keyof Order)[] = ["code"];
  protected uniqueScope?: (keyof Order)[] = ["companyId"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof Order = "timeAt";

  constructor(
    @inject(ORDER_TYPES.OrderRepository)
    repository: OrderRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
    @inject(ORDER_LINE_TYPES.OrderLineRepository)
    private orderLineRepository: OrderLineRepository,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
  ) {
    super();
    this.repository = repository;
  }

  async actionAfterCreate(
    data: Order,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Notify users with read permission on "order" module
    await this.notificationService.notifyUsersWithReadPermission(
      data,
      "order",
      NotificationType.ORDER,
      ActionType.CREATE,
      data.creatorId,
    );
  }

  async update(
    id: string,
    data: DeepPartial<Order>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<Order | null> {
    const { lines, ...safeData } = data;
    const result = await super.update(
      id,
      safeData as DeepPartial<Order>,
      manager,
      req,
    );
    if (lines !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const lineRepo = trxManager.getRepository(OrderLine);
        const existing = await lineRepo.find({
          where: { orderId: id },
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
          orderId: id,
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

  async complete(id: string, req?: RequestContext): Promise<Order> {
    return withTransaction(async (trxManager) => {
      const order = await this.repository.findById(id, trxManager);
      if (!order) throw new NotFoundError("Không tìm thấy đơn hàng");
      if (order.isCompleted) {
        throw new BadRequestError("Đơn hàng đã được hoàn thành");
      }

      return trxManager.getRepository(Order).save({
        ...order,
        isCompleted: true,
        completedAt: new Date(),
      });
    });
  }

  async cancel(id: string, req?: RequestContext): Promise<Order> {
    return withTransaction(async (trxManager) => {
      const order = await this.repository.findById(id, trxManager);
      if (!order) throw new NotFoundError("Không tìm thấy đơn hàng");
      if (order.isCompleted) {
        throw new BadRequestError("Không thể hủy đơn hàng đã hoàn thành");
      }
      return trxManager.getRepository(Order).remove(order);
    });
  }

  async validateBeforeCreate(
    data: DeepPartial<Order>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
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
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Order>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const order = await this.repository.findById(id, manager);
    if (!order) throw new NotFoundError("Không tìm thấy đơn hàng");

    const canUpdate = await this.canUpdate(order, req);
    if (!canUpdate.can) throw new BadRequestError(canUpdate.reason);
  }

  // ======================== ACTIONS ========================

  protected async attachActions(
    entity: Order & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: Order | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    actions.complete = await this.canComplete(entity, req);
    actions.createShippingPlan = await this.canCreateShippingPlan(entity, req);
    actions.createStockDocument = await this.canCreateStockDocument(
      entity,
      req,
    );
    return actions;
  }

  // ======================== CAN CHECKS ========================

  async canUpdate(entity: Order, _req?: RequestContext): Promise<ActionValue> {
    if (entity.isCompleted) {
      return {
        can: false,
        reason: "Không thể sửa đơn hàng đã hoàn thành",
      };
    }
    return { can: true };
  }

  async canDelete(entity: Order, _req?: RequestContext): Promise<ActionValue> {
    if (entity.isCompleted) {
      return {
        can: false,
        reason: "Không thể xóa đơn hàng đã hoàn thành",
      };
    }
    return { can: true };
  }

  async canComplete(
    entity: Order,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.isCompleted) {
      return { can: false, reason: "Đơn hàng đã được hoàn thành" };
    }
    return { can: true };
  }

  /**
   * Kiểm tra xem có thể tạo phương án vận chuyển từ đơn hàng này không.
   */
  async canCreateShippingPlan(
    entity: Order | string,
    req?: RequestContext,
  ): Promise<ActionValue> {
    const order =
      typeof entity === "string"
        ? await this.repository.findById(entity)
        : entity;
    if (!order) return { can: false, reason: "Không tìm thấy đơn hàng" };

    if (order.isCompleted) {
      return {
        can: false,
        reason: "Đơn hàng đã hoàn thành, không thể tạo phương án vận chuyển",
      };
    }
    return { can: true };
  }

  /**
   * Kiểm tra xem có thể tạo phiếu xuất kho từ đơn hàng này không.
   */
  async canCreateStockDocument(
    entity: Order | string,
    req?: RequestContext,
  ): Promise<ActionValue> {
    const order =
      typeof entity === "string"
        ? await this.repository.findById(entity)
        : entity;
    if (!order) return { can: false, reason: "Không tìm thấy đơn hàng" };

    if (order.isCompleted) {
      return {
        can: false,
        reason: "Đơn hàng đã hoàn thành, không thể tạo phiếu xuất kho",
      };
    }
    return { can: true };
  }

  /**
   * Tính lại deliveredQuantity cho từng OrderLine của một đơn bán
   * dựa trên tất cả StockDocumentLine đã complete, chưa xóa.
   * deliveredQuantity = Σ(line.billingQuantity) của các phiếu (doc) status=COMPLETED
   * và chưa bị xóa (deletedAt IS NULL).
   */
  async recalculateLineDeliveryQuantities(
    orderId: string,
    manager: EntityManager,
  ): Promise<void> {
    const lines = await this.orderLineRepository.find({
      where: { orderId },
      select: ["id"],
    });

    if (!lines.length) return;

    for (const line of lines) {
      const orderLineId = line.id;

      // Tính tổng deliveredQuantity từ TẤT CẢ các stock document line đã complete, chưa xóa
      const totalResult = await manager
        .getRepository(StockDocumentLine)
        .createQueryBuilder("line")
        .innerJoin(StockDocument, "doc", "doc.id = line.stockDocumentId")
        .select("COALESCE(SUM(line.billingQuantity), 0)", "total")
        .where("line.orderLineId = :orderLineId")
        .andWhere("line.deletedAt IS NULL")
        .andWhere("doc.status = :status")
        .andWhere("doc.deletedAt IS NULL")
        .setParameters({
          orderLineId,
          status: StockDocumentStatus.COMPLETED,
        })
        .getRawOne<{ total: string }>();

      await this.orderLineRepository.update(
        orderLineId,
        { deliveredQuantity: Number(totalResult?.total) || 0 },
        manager,
      );
    }
  }
}
