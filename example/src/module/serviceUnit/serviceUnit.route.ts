import { Router } from "express";
import { injectable, inject } from "inversify";
import { ServiceUnitController } from "./serviceUnit.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateServiceUnitSchema,
  UpdateServiceUnitSchema,
  ServiceUnitQuerySchema,
  ServiceUnitParamsSchema,
} from "./serviceUnit.validator";
import { SERVICE_UNIT_TYPES } from "./serviceUnit.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class ServiceUnitRouter {
  private router: Router;

  constructor(
    @inject(SERVICE_UNIT_TYPES.ServiceUnitController)
    private controller: ServiceUnitController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ServiceUnitQuerySchema, "query"),
      permissionMiddleware("service", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      zodValidate(CreateServiceUnitSchema, "body"),
      permissionMiddleware("service", "update"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(ServiceUnitParamsSchema, "params"),
      permissionMiddleware("service", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(ServiceUnitParamsSchema, "params"),
      zodValidate(UpdateServiceUnitSchema, "body"),
      permissionMiddleware("service", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(ServiceUnitParamsSchema, "params"),
      permissionMiddleware("service", "update"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
