import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { OrderLineRepository } from "./orderLine.repository";
import { ORDER_LINE_TYPES } from "./orderLine.types";
import { OrderLine } from "@/database/models/store/OrderLine";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { OrderLineCreateParamsDto } from "./orderLine.validator";
import { BadRequestError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";
import { ORDER_TYPES } from "../order.types";
import { OrderService } from "../order.service";
import { OrderRepository } from "../order.repository";
import logger from "@/shared/utils/logger";
import { PRODUCT_TYPES, ProductRepository } from "@/modules/product";
import { IError } from "@/shared/types/errors";
import { config } from "@/config/env";
import { OrderTypeEnum } from "@/shared/constants/enum";

/**
 * OrderLine Service - Tenant Entity
 */
@injectable()
export class OrderLineService extends BaseService<OrderLine> {
  protected repository: OrderLineRepository;
  protected uniqueFields: (keyof OrderLine)[] = ["productVariantId"];
  protected uniqueScope: (keyof OrderLine)[] = ["orderId"];
  protected searchableFields = ["note"]; // Note from BaseEntity

  constructor(
    @inject(ORDER_LINE_TYPES.OrderLineRepository)
    repository: OrderLineRepository,
    @inject(ORDER_TYPES.OrderRepository)
    private orderRepository: OrderRepository,
    @inject(ORDER_TYPES.OrderService)
    private orderService: OrderService,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
  ) {
    super();
    this.repository = repository;
  }

  // Kiểm tra xem đơn đã cũ hơn 1 tuần chưa
  async checkIfOrderIsEditable(
    orderId: string,
    manager: EntityManager,
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId, manager);

    if (!order) {
      throw new BadRequestError("Không tìm thấy đơn hàng.");
    }
  }

  async validateBeforeCreate(
    data: DeepPartial<OrderLine>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const errors: IError[] = [];
    const { orderId } = req?.params as OrderLineCreateParamsDto;
    await this.checkIfOrderIsEditable(orderId, manager);
    data.orderId = orderId;

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      errors.push({
        field: "orderId",
        code: ErrorsMessages.invalid,
      });
      throw new BadRequestError("Validation errors", errors);
    }

    const isReturnOrder =
      order.type === OrderTypeEnum.PURCHASE_RETURN ||
      order.type === OrderTypeEnum.SALE_RETURN;

    if (isReturnOrder) {
      if (!data.refOrderLineId) {
        errors.push({
          field: "refOrderLineId",
          code: ErrorsMessages.required,
        });
      } else {
        const refLine = await manager.findOne(OrderLine, {
          where: { id: data.refOrderLineId, orderId: order.refOrderId! },
        });

        if (!refLine) {
          errors.push({
            field: "refOrderLineId",
            code: ErrorsMessages.invalid,
          });
        } else {
          // Đắp productVariantId và snapshot từ line gốc
          data.productVariantId = refLine.productVariantId;
          data.taxRate = refLine.taxRate;

          if (data.quantity! > refLine.quantity) {
            errors.push({
              field: `quantity`,
              code: ErrorsMessages.max,
            });
          }
        }
      }
    }

    // Set snapshot of productVariantAtTime
    if (data.productVariantId) {
      const productVariantSnapshot =
        await this.productRepository.getProductVariantSnapshot(
          data.productVariantId,
        );
      if (!productVariantSnapshot) {
        errors.push({
          field: "productVariantId",
          code: ErrorsMessages.invalid,
        });
      } else {
        data.productVariantSnapshot = productVariantSnapshot;
      }
    }

    // Set sortOrder
    const maxSortOrderLine = await this.repository.findOne({
      where: { orderId },
      order: { sortOrder: "DESC" },
    });
    data.sortOrder =
      (maxSortOrderLine?.sortOrder || 0) + config.SORT_ORDER_STEP;

    if (errors.length > 0) {
      throw new BadRequestError("Validation errors", errors);
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<OrderLine>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const errors: IError[] = [];
    const { orderId } = req?.params as OrderLineCreateParamsDto;
    await this.checkIfOrderIsEditable(orderId, manager);
    data.orderId = orderId;

    const existingLine = await manager.findOne(OrderLine, {
      where: { id },
      relations: { refOrderLine: true, order: true },
    });

    if (!existingLine) {
      errors.push({
        field: "id",
        code: ErrorsMessages.not_found,
      });
      throw new BadRequestError("Validation errors", errors);
    }

    const isReturnOrder =
      existingLine.order.type === OrderTypeEnum.PURCHASE_RETURN ||
      existingLine.order.type === OrderTypeEnum.SALE_RETURN;

    if (
      isReturnOrder &&
      data.quantity !== undefined &&
      data.quantity > existingLine.refOrderLine!.quantity
    ) {
      errors.push({
        field: "quantity",
        code: ErrorsMessages.max,
      });
    }
  }

  async validateBeforeDelete(
    data: Partial<OrderLine>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { orderId } = req?.params as OrderLineCreateParamsDto;
    await this.checkIfOrderIsEditable(orderId, manager!);
    // Không được xóa nếu chỉ còn 1 line
    const lineCount = await this.repository.count({
      where: { orderId: data.orderId },
    });
    if (lineCount <= 1) {
      throw new BadRequestError(
        "Cannot delete the last line of a contract item.",
        {
          field: "id",
          code: ErrorsMessages.is_last_item,
        },
      );
    }
  }

  async handleOrderLineChanged(
    data: OrderLine,
    manager: EntityManager,
  ): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: data.orderId },
    });

    if (!order) {
      logger.error(
        `Order not found when recalculating order after line change. OrderId: ${data.orderId}`,
      );
      return;
    }

    // Bước 1: Tính lại Order (recalculate amounts)
    await this.orderService.recalculateOrder(order.id, manager);

    await this.orderService.handleAfterChangedData(order, manager);
  }

  async actionAfterCreate(
    data: OrderLine,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleOrderLineChanged(data, manager);
  }

  async actionAfterUpdate(
    data: OrderLine,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleOrderLineChanged(data, manager);
  }

  async actionAfterDelete(
    data: OrderLine,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleOrderLineChanged(data, manager);
  }
}
