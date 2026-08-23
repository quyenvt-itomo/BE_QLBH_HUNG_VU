import { injectable, inject } from "inversify";
import { OrderService } from "./order.service";
import { ORDER_TYPES } from "./order.types";
import { BaseController } from "@/shared/base/BaseController";
import { Order } from "@/database/models/store/Order";
import { asyncHandler } from "@/shared/utils/controller.utils";

/**
 * Order Controller - Tenant Entity
 */
@injectable()
export class OrderController extends BaseController<Order> {
  protected service: OrderService;

  constructor(
    @inject(ORDER_TYPES.OrderService)
    service: OrderService,
  ) {
    super();
    this.service = service;
  }

  complete = asyncHandler(async (req, res) => {
    const data = await this.service.complete(req.params.id, this.service.getReqContext(req));
    this.sendResponse({ res, data });
  });

  cancel = asyncHandler(async (req, res) => {
    const data = await this.service.cancel(req.params.id, this.service.getReqContext(req));
    this.sendResponse({ res, data });
  });
}
