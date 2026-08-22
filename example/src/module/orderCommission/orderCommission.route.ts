import { Router } from "express";
import { injectable, inject } from "inversify";
import { OrderCommissionController } from "./orderCommission.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateOrderCommissionSchema,
  UpdateOrderCommissionSchema,
  OrderCommissionQuerySchema,
  OrderCommissionParamsSchema,
} from "./orderCommission.validator";
import { ORDER_COMMISSION_TYPES } from "./orderCommission.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class OrderCommissionRouter {
  private router: Router;

  constructor(
    @inject(ORDER_COMMISSION_TYPES.OrderCommissionController)
    private controller: OrderCommissionController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(OrderCommissionQuerySchema, "query"),
      permissionMiddleware("order", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateOrderCommissionSchema, "body"),
      permissionMiddleware("order", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(OrderCommissionParamsSchema, "params"),
      permissionMiddleware("order", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(OrderCommissionParamsSchema, "params"),
      zodValidate(UpdateOrderCommissionSchema, "body"),
      permissionMiddleware("order", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(OrderCommissionParamsSchema, "params"),
      permissionMiddleware("order", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
