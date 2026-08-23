import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { OrderController } from "./order.controller";
import { ORDER_TYPES } from "./order.types";
import { CreateOrderSchema, OrderParamsSchema, OrderQuerySchema, UpdateOrderSchema } from "./order.validator";

@injectable()
export class OrderRouter {
  private router = Router();
  constructor(@inject(ORDER_TYPES.OrderController) private controller: OrderController) { this.initializeRoutes(); }

  private initializeRoutes(): void {
    const module = (req: any) => req.orderContext?.module;
    this.router.get("/", zodValidate(OrderQuerySchema, "query"), permissionMiddleware(module, "read"), this.controller.getAllWithPagination);
    this.router.post("/", zodValidate(CreateOrderSchema, "body"), permissionMiddleware(module, "create"), this.controller.create);
    this.router.get("/:id", zodValidate(OrderParamsSchema, "params"), permissionMiddleware(module, "read"), this.controller.getById);
    this.router.put("/:id", zodValidate(OrderParamsSchema, "params"), zodValidate(UpdateOrderSchema, "body"), permissionMiddleware(module, "update"), this.controller.update);
    this.router.post("/:id/complete", zodValidate(OrderParamsSchema, "params"), permissionMiddleware(module, "complete"), this.controller.complete);
    this.router.post("/:id/cancel", zodValidate(OrderParamsSchema, "params"), permissionMiddleware(module, "update"), this.controller.cancel);
    this.router.delete("/:id", zodValidate(OrderParamsSchema, "params"), permissionMiddleware(module, "delete"), this.controller.delete);
  }
  public getRouter(): Router { return this.router; }
}
