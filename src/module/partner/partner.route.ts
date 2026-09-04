import { Router } from "express";
import { injectable, inject } from "inversify";
import { PartnerController } from "./partner.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreatePartnerSchema,
  UpdatePartnerSchema,
  PartnerQuerySchema,
  PartnerParamsSchema,
} from "./partner.validator";
import { BaseDeleteManySchema } from "@/shared/base/BaseValidator";
import { PARTNER_TYPES } from "./partner.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PartnerRouter {
  private router: Router;

  constructor(
    @inject(PARTNER_TYPES.PartnerController)
    private partnerController: PartnerController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
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

    this.router.delete(
      "/bulk",
      zodValidate(BaseDeleteManySchema, "body"),
      permissionMiddleware((req) => req.partnerContext!.module, "delete"),
      this.partnerController.deleteMany,
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
}
