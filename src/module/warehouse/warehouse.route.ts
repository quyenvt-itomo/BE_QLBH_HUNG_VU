import { Router } from "express";
import { injectable, inject } from "inversify";
import { WarehouseController } from "./warehouse.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateWarehouseSchema,
  UpdateWarehouseSchema,
  WarehouseQuerySchema,
  WarehouseParamsSchema,
} from "./warehouse.validator";
import { WAREHOUSE_TYPES } from "./warehouse.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class WarehouseRouter {
  private router: Router;

  constructor(
    @inject(WAREHOUSE_TYPES.WarehouseController)
    private controller: WarehouseController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(WarehouseQuerySchema, "query"),
      permissionMiddleware("warehouse", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateWarehouseSchema, "body"),
      permissionMiddleware("warehouse", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(WarehouseParamsSchema, "params"),
      permissionMiddleware("warehouse", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(WarehouseParamsSchema, "params"),
      zodValidate(UpdateWarehouseSchema, "body"),
      permissionMiddleware("warehouse", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(WarehouseParamsSchema, "params"),
      permissionMiddleware("warehouse", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
