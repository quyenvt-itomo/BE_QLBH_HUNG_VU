import { Router } from "express";
import { injectable, inject } from "inversify";
import { PartnerSubTypeController } from "./partnerSubType.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreatePartnerSubTypeSchema,
  UpdatePartnerSubTypeSchema,
  PartnerSubTypeParamsSchema,
  PartnerSubTypeCreateParamsSchema,
} from "./partnerSubType.validator";
import { PARTNER_SUB_TYPE_TYPES } from "./partnerSubType.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PartnerSubTypeRouter {
  private router: Router;

  constructor(
    @inject(PARTNER_SUB_TYPE_TYPES.PartnerSubTypeController)
    private partnerSubTypeController: PartnerSubTypeController
  ) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All partner-contact routes require tenant context (tenant already resolved by client.routes)
    // GET /partner-contact - Get all partner-contact with filters
    // this.router.get(
    //   "/",
    //   zodValidate(PartnerSubTypeQuerySchema, "query"),
    //   this.partnerSubTypeController.getAllWithPagination
    // );

    // POST /partner-contact - Create new partner-contact
    this.router.post(
      "/",
      zodValidate(PartnerSubTypeCreateParamsSchema, "params"),
      zodValidate(CreatePartnerSubTypeSchema, "body"),
      this.partnerSubTypeController.create
    );

    // GET /partner-contact/:id - Get partner-contact by ID
    // this.router.get(
    //   "/:id",
    //   zodValidate(PartnerSubTypeParamsSchema, "params"),
    //   this.partnerSubTypeController.getById
    // );

    // PUT /partner-contact/:id - Update partner-contact
    this.router.put(
      "/:id",
      zodValidate(PartnerSubTypeParamsSchema, "params"),
      zodValidate(UpdatePartnerSubTypeSchema, "body"),
      this.partnerSubTypeController.update
    );

    // DELETE /partner-contact/:id - Delete partner-contact
    this.router.delete(
      "/:id",
      zodValidate(PartnerSubTypeParamsSchema, "params"),
      permissionMiddleware("employee", "delete"),
      this.partnerSubTypeController.delete
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
