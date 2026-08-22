import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationQuerySchema,
  OrganizationParamsSchema,
  OrganizationPublicParamsSchema,
  UpdateSortOrderSchema,
} from "./organization.validator";
import { OrganizationController } from "./organization.controller";
import { ORGANIZATION_TYPES } from "./organization.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class OrganizationRouter {
  private router: Router;

  constructor(
    @inject(ORGANIZATION_TYPES.OrganizationController)
    private controller: OrganizationController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All store routes require authentication
    // this.router.use(authenticate);

    // GET /stores - Get all stores with filters
    this.router.get(
      "/",
      zodValidate(OrganizationQuerySchema, "query"),
      permissionMiddleware("organization", "read"),
      this.controller.getAllWithPagination,
    );

    // POST /stores - Create new store
    this.router.post(
      "/",
      zodValidate(CreateOrganizationSchema, "body"),
      permissionMiddleware("organization", "create"),
      this.controller.create,
    );

    // GET /stores/:id - Get store by ID
    this.router.get(
      "/:id",
      zodValidate(OrganizationParamsSchema, "params"),
      permissionMiddleware("organization", "read"),
      this.controller.getById,
    );

    this.router.post(
      "/update-sort-order",
      zodValidate(UpdateSortOrderSchema, "body"),
      permissionMiddleware("organization", "update"),
      this.controller.updateBulkSortOrder,
    );

    // PUT /stores/:id - Update store
    this.router.put(
      "/:id",
      zodValidate(OrganizationParamsSchema, "params"),
      zodValidate(UpdateOrganizationSchema, "body"),
      permissionMiddleware("organization", "update"),
      this.controller.update,
    );

    // DELETE /stores/:id - Delete store
    this.router.delete(
      "/:id",
      zodValidate(OrganizationParamsSchema, "params"),
      permissionMiddleware("organization", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }

  public getPublicRouter(): Router {
    const publicRouter = Router();
    publicRouter.get(
      "/code/:code",
      zodValidate(OrganizationPublicParamsSchema, "params"),
      this.controller.getPublicInfoByCode,
    );
    return publicRouter;
  }
}
