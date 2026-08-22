import { Router } from "express";
import { injectable, inject } from "inversify";
import { InventoryConversionController } from "./inventoryConversion.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateInventoryConversionSchema,
  UpdateInventoryConversionSchema,
  InventoryConversionQuerySchema,
  InventoryConversionParamsSchema,
} from "./inventoryConversion.validator";
import { INVENTORY_CONVERSION_TYPES } from "./inventoryConversion.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class InventoryConversionRouter {
  private router: Router;

  constructor(
    @inject(INVENTORY_CONVERSION_TYPES.InventoryConversionController)
    private controller: InventoryConversionController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(InventoryConversionQuerySchema, "query"),
      permissionMiddleware("inventoryConversion", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateInventoryConversionSchema, "body"),
      permissionMiddleware("inventoryConversion", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(InventoryConversionParamsSchema, "params"),
      permissionMiddleware("inventoryConversion", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(InventoryConversionParamsSchema, "params"),
      zodValidate(UpdateInventoryConversionSchema, "body"),
      permissionMiddleware("inventoryConversion", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(InventoryConversionParamsSchema, "params"),
      permissionMiddleware("inventoryConversion", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
