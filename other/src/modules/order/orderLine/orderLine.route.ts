import { Router } from "express";
import { injectable, inject } from "inversify";
import { OrderLineController } from "./orderLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateOrderLineSchema,
  UpdateOrderLineSchema,
  OrderLineParamsSchema,
  OrderLineCreateParamsSchema,
} from "./orderLine.validator";
import { ORDER_LINE_TYPES } from "./orderLine.types";

@injectable()
export class OrderLineRouter {
  private router: Router;

  constructor(
    @inject(ORDER_LINE_TYPES.OrderLineController)
    private orderLineController: OrderLineController
  ) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All line routes require tenant context (tenant already resolved by client.routes)
    // GET /line - Get all line with filters
    // this.router.get(
    //   "/",
    //   zodValidate(OrderLineQuerySchema, "query"),
    //   this.orderLineController.getAllWithPagination
    // );

    // POST /line - Create new line
    this.router.post(
      "/",
      zodValidate(OrderLineCreateParamsSchema, "params"),
      zodValidate(CreateOrderLineSchema, "body"),
      this.orderLineController.create
    );

    // GET /line/:id - Get line by ID
    // this.router.get(
    //   "/:id",
    //   zodValidate(OrderLineParamsSchema, "params"),
    //   this.orderLineController.getById
    // );

    // PUT /line/:id - Update line
    this.router.put(
      "/:id",
      zodValidate(OrderLineParamsSchema, "params"),
      zodValidate(UpdateOrderLineSchema, "body"),
      this.orderLineController.update
    );

    // DELETE /line/:id - Delete line
    this.router.delete(
      "/:id",
      zodValidate(OrderLineParamsSchema, "params"),
      this.orderLineController.delete
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
