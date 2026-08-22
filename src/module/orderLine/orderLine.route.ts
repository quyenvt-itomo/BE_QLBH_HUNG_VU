import { Router } from "express";
import { injectable, inject } from "inversify";
import { OrderLineController } from "./orderLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateOrderLineSchema,
  UpdateOrderLineSchema,
  OrderLineQuerySchema,
  OrderLineParamsSchema,
} from "./orderLine.validator";
import { ORDER_LINE_TYPES } from "./orderLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class OrderLineRouter {
  private router: Router;

  constructor(
    @inject(ORDER_LINE_TYPES.OrderLineController)
    private controller: OrderLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(OrderLineQuerySchema, "query"),
      permissionMiddleware("order", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateOrderLineSchema, "body"),
      permissionMiddleware("order", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(OrderLineParamsSchema, "params"),
      permissionMiddleware("order", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(OrderLineParamsSchema, "params"),
      zodValidate(UpdateOrderLineSchema, "body"),
      permissionMiddleware("order", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(OrderLineParamsSchema, "params"),
      permissionMiddleware("order", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
