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
import { ORDER_LINE_TYPES, OrderLineRouter } from "./orderLine";

@injectable()
export class OrderRouter {
  private router: Router;

  constructor(
    @inject(ORDER_TYPES.OrderController)
    private orderController: OrderController,
    @inject(ORDER_LINE_TYPES.OrderLineRouter)
    private orderLineController: OrderLineRouter,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All order routes require tenant context (tenant already resolved by client.routes)

    this.router.use(
      "/:orderId/line",
      permissionMiddleware((req) => req.orderContext!.module, "update"),
      this.orderController.checkExits("orderId"),
      this.orderLineController.getRouter(),
    );

    // GET /orders - Get all orders with filters
    this.router.get(
      "/",
      zodValidate(OrderQuerySchema, "query"),
      permissionMiddleware((req) => req.orderContext!.module, "read"),
      this.orderController.getAllWithPagination,
    );

    // POST /orders - Create new order
    this.router.post(
      "/",
      zodValidate(CreateOrderSchema, "body"),
      permissionMiddleware((req) => req.orderContext!.module, "create"),
      this.orderController.create,
    );

    // GET /orders/:id - Get order by ID
    this.router.get(
      "/:id",
      zodValidate(OrderParamsSchema, "params"),
      permissionMiddleware((req) => req.orderContext!.module, "read"),
      this.orderController.getById,
    );

    // PUT /orders/:id - Update order
    this.router.put(
      "/:id",
      zodValidate(OrderParamsSchema, "params"),
      zodValidate(UpdateOrderSchema, "body"),
      permissionMiddleware((req) => req.orderContext!.module, "update"),
      this.orderController.update,
    );

    // DELETE /orders/:id - Delete order
    this.router.delete(
      "/:id",
      zodValidate(OrderParamsSchema, "params"),
      permissionMiddleware((req) => req.orderContext!.module, "delete"),
      this.orderController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
