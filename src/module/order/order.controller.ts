import { injectable, inject } from "inversify";
import { OrderService } from "./order.service";
import { ORDER_TYPES } from "./order.types";
import { BaseController } from "@/shared/base/BaseController";
import { Order } from "@/database/models/store/Order";
import { asyncHandler } from "@/shared/utils/controller.utils";

@injectable()
export class OrderController extends BaseController<Order> {
  protected service: OrderService;

  constructor(@inject(ORDER_TYPES.OrderService) service: OrderService) {
    super();
    this.service = service;
  }

  complete = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const requestContext = (req as any).requestContext;
    const data = await this.service.complete(id, requestContext);
    this.sendResponse({ res, data });
  });

  cancel = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const requestContext = (req as any).requestContext;
    const data = await this.service.cancel(id, requestContext);
    this.sendResponse({ res, data });
  });
}
