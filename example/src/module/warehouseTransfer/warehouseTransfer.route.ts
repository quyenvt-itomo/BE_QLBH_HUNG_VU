import { Router } from "express";
import { injectable, inject } from "inversify";
import { WarehouseTransferController } from "./warehouseTransfer.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateWarehouseTransferSchema,
  UpdateWarehouseTransferSchema,
  WarehouseTransferQuerySchema,
  WarehouseTransferParamsSchema,
  ConfirmTransferSchema,
} from "./warehouseTransfer.validator";
import { WAREHOUSE_TRANSFER_TYPES } from "./warehouseTransfer.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class WarehouseTransferRouter {
  private router: Router;

  constructor(
    @inject(WAREHOUSE_TRANSFER_TYPES.WarehouseTransferController)
    private controller: WarehouseTransferController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(WarehouseTransferQuerySchema, "query"),
      permissionMiddleware("warehouseTransfer", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateWarehouseTransferSchema, "body"),
      permissionMiddleware("warehouseTransfer", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(WarehouseTransferParamsSchema, "params"),
      permissionMiddleware("warehouseTransfer", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(WarehouseTransferParamsSchema, "params"),
      zodValidate(UpdateWarehouseTransferSchema, "body"),
      permissionMiddleware("warehouseTransfer", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(WarehouseTransferParamsSchema, "params"),
      permissionMiddleware("warehouseTransfer", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/confirm-export",
      zodValidate(WarehouseTransferParamsSchema, "params"),
      zodValidate(ConfirmTransferSchema, "body"),
      permissionMiddleware("warehouseTransfer", "confirmExport"),
      this.controller.confirmExport,
    );

    this.router.post(
      "/:id/confirm-import",
      zodValidate(WarehouseTransferParamsSchema, "params"),
      zodValidate(ConfirmTransferSchema, "body"),
      permissionMiddleware("warehouseTransfer", "confirmImport"),
      this.controller.confirmImport,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
