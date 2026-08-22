import { Router } from "express";
import { injectable, inject } from "inversify";
import { ServiceController } from "./service.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  ServiceQuerySchema,
  ServiceParamsSchema,
} from "./service.validator";
import { SERVICE_TYPES } from "./service.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class ServiceRouter {
  private router: Router;

  constructor(
    @inject(SERVICE_TYPES.ServiceController)
    private controller: ServiceController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ServiceQuerySchema, "query"),
      permissionMiddleware("service", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateServiceSchema, "body"),
      permissionMiddleware("service", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(ServiceParamsSchema, "params"),
      permissionMiddleware("service", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(ServiceParamsSchema, "params"),
      zodValidate(UpdateServiceSchema, "body"),
      permissionMiddleware("service", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(ServiceParamsSchema, "params"),
      permissionMiddleware("service", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
