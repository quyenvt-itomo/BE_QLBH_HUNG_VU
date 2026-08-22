import { Router } from "express";
import { injectable, inject } from "inversify";
import { PartnerController } from "./partner.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreatePartnerSchema,
  UpdatePartnerSchema,
  PartnerQuerySchema,
  PartnerParamsSchema,
  PartnerQueryByRoleSchema,
} from "./partner.validator";
import { PARTNER_TYPES } from "./partner.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { PARTNER_CONTACT_TYPES, PartnerContactRouter } from "./partnerContact";
import { PARTNER_SUB_TYPE_TYPES, PartnerSubTypeRouter } from "./partnerSubType";

@injectable()
export class PartnerRouter {
  private router: Router;

  constructor(
    @inject(PARTNER_TYPES.PartnerController)
    private partnerController: PartnerController,
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRouter)
    private partnerContactRouter: PartnerContactRouter,
    @inject(PARTNER_SUB_TYPE_TYPES.PartnerSubTypeRouter)
    private partnerSubTypeRouter: PartnerSubTypeRouter,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All partner routes require tenant context (tenant already resolved by client.routes)

    this.router.use(
      "/:partnerId/contact",
      permissionMiddleware((req) => req.partnerContext!.module, "update"),
      this.partnerController.checkExits("partnerId"),
      this.partnerContactRouter.getRouter(),
    );

    this.router.use(
      "/:partnerId/sub-type",
      permissionMiddleware((req) => req.partnerContext!.module, "update"),
      this.partnerController.checkExits("partnerId"),
      this.partnerSubTypeRouter.getRouter(),
    );

    // GET /:type - Get all partner with filters
    this.router.get(
      "/",
      zodValidate(PartnerQuerySchema, "query"),
      permissionMiddleware((req) => req.partnerContext!.module, "read"),
      this.partnerController.getAllWithPagination,
    );

    // POST /:type - Create new partner
    this.router.post(
      "/",
      zodValidate(CreatePartnerSchema, "body"),
      permissionMiddleware((req) => req.partnerContext!.module, "create"),
      this.partnerController.create,
    );

    // GET /:type/:id - Get partner by ID
    this.router.get(
      "/:id",
      zodValidate(PartnerParamsSchema, "params"),
      permissionMiddleware((req) => req.partnerContext!.module, "read"),
      this.partnerController.getById,
    );

    // PUT /:type/:id - Update partner
    this.router.put(
      "/:id",
      zodValidate(PartnerParamsSchema, "params"),
      zodValidate(UpdatePartnerSchema, "body"),
      permissionMiddleware((req) => req.partnerContext!.module, "update"),
      this.partnerController.update,
    );

    // DELETE /:type/:id - Delete partner
    this.router.delete(
      "/:id",
      zodValidate(PartnerParamsSchema, "params"),
      permissionMiddleware((req) => req.partnerContext!.module, "delete"),
      this.partnerController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }

  public getByRoleRouter(): Router {
    const route = Router();
    route.get(
      "/by-role",
      zodValidate(PartnerQueryByRoleSchema, "query"),
      this.partnerController.getByRole,
    );
    return route;
  }
}
