import { Router } from "express";
import { injectable, inject } from "inversify";
import { BillOfMaterialController } from "./billOfMaterial.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateBillOfMaterialSchema,
  UpdateBillOfMaterialSchema,
  BillOfMaterialQuerySchema,
  BillOfMaterialParamsSchema,
} from "./billOfMaterial.validator";
import { BILL_OF_MATERIAL_TYPES } from "./billOfMaterial.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class BillOfMaterialRouter {
  private router: Router;

  constructor(
    @inject(BILL_OF_MATERIAL_TYPES.BillOfMaterialController)
    private controller: BillOfMaterialController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(BillOfMaterialQuerySchema, "query"),
      permissionMiddleware("bom", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateBillOfMaterialSchema, "body"),
      permissionMiddleware("bom", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(BillOfMaterialParamsSchema, "params"),
      permissionMiddleware("bom", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(BillOfMaterialParamsSchema, "params"),
      zodValidate(UpdateBillOfMaterialSchema, "body"),
      permissionMiddleware("bom", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(BillOfMaterialParamsSchema, "params"),
      permissionMiddleware("bom", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
