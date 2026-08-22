import { Router } from "express";
import { injectable, inject } from "inversify";
import { OrderController } from "./order.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderQuerySchema,
  OrderParamsSchema,
} from "./order.validator";
import { ORDER_TYPES } from "./order.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class OrderRouter {
  private router: Router;

  constructor(
    @inject(ORDER_TYPES.OrderController)
    private controller: OrderController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(OrderQuerySchema, "query"),
      permissionMiddleware("order", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateOrderSchema, "body"),
      permissionMiddleware("order", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(OrderParamsSchema, "params"),
      permissionMiddleware("order", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(OrderParamsSchema, "params"),
      zodValidate(UpdateOrderSchema, "body"),
      permissionMiddleware("order", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(OrderParamsSchema, "params"),
      permissionMiddleware("order", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/complete",
      zodValidate(OrderParamsSchema, "params"),
      permissionMiddleware("order", "complete"),
      this.controller.complete,
    );

    this.router.post(
      "/:id/cancel",
      zodValidate(OrderParamsSchema, "params"),
      permissionMiddleware("order", "update"),
      this.controller.cancel,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
