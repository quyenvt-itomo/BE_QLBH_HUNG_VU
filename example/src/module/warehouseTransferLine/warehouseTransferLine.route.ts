import { Router } from "express";
import { injectable, inject } from "inversify";
import { WarehouseTransferLineController } from "./warehouseTransferLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateWarehouseTransferLineSchema,
  UpdateWarehouseTransferLineSchema,
  WarehouseTransferLineQuerySchema,
  WarehouseTransferLineParamsSchema,
} from "./warehouseTransferLine.validator";
import { WAREHOUSE_TRANSFER_LINE_TYPES } from "./warehouseTransferLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class WarehouseTransferLineRouter {
  private router: Router;

  constructor(
    @inject(WAREHOUSE_TRANSFER_LINE_TYPES.WarehouseTransferLineController)
    private controller: WarehouseTransferLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(WarehouseTransferLineQuerySchema, "query"),
      permissionMiddleware("warehouseTransfer", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateWarehouseTransferLineSchema, "body"),
      permissionMiddleware("warehouseTransfer", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(WarehouseTransferLineParamsSchema, "params"),
      permissionMiddleware("warehouseTransfer", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(WarehouseTransferLineParamsSchema, "params"),
      zodValidate(UpdateWarehouseTransferLineSchema, "body"),
      permissionMiddleware("warehouseTransfer", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(WarehouseTransferLineParamsSchema, "params"),
      permissionMiddleware("warehouseTransfer", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
