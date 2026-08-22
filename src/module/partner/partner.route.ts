import { Router } from "express";
import { injectable, inject } from "inversify";
import { PartnerController } from "./partner.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreatePartnerSchema,
  UpdatePartnerSchema,
  PartnerQuerySchema,
  PartnerParamsSchema,
  PartnerContactSchema,
  PartnerPublicParamsSchema,
} from "./partner.validator";
import { PARTNER_TYPES } from "./partner.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import * as z from "zod";
import { BaseParamsSchema } from "@/shared/base/BaseValidator";

const ContactParamsSchema = BaseParamsSchema.extend({
  contactId: z.uuid(),
});

@injectable()
export class PartnerRouter {
  private router: Router;

  constructor(
    @inject(PARTNER_TYPES.PartnerController)
    private controller: PartnerController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET / - Get all partners
    this.router.get(
      "/",
      zodValidate(PartnerQuerySchema, "query"),
      permissionMiddleware("partner", "read"),
      this.controller.getAllWithPagination,
    );

    // POST / - Create new partner
    this.router.post(
      "/",
      zodValidate(CreatePartnerSchema, "body"),
      permissionMiddleware("partner", "create"),
      this.controller.create,
    );

    // GET /:id - Get partner by ID
    this.router.get(
      "/:id",
      zodValidate(PartnerParamsSchema, "params"),
      permissionMiddleware("partner", "read"),
      this.controller.getById,
    );

    // PUT /:id - Update partner
    this.router.put(
      "/:id",
      zodValidate(PartnerParamsSchema, "params"),
      zodValidate(UpdatePartnerSchema, "body"),
      permissionMiddleware("partner", "update"),
      this.controller.update,
    );

    // DELETE /:id - Delete partner
    this.router.delete(
      "/:id",
      zodValidate(PartnerParamsSchema, "params"),
      permissionMiddleware("partner", "delete"),
      this.controller.delete,
    );

    // ─── Contact sub-resource ───────────────────────────────────────────────
    this.router.get(
      "/:id/contacts",
      zodValidate(PartnerParamsSchema, "params"),
      permissionMiddleware("partner", "read"),
      this.controller.getContacts,
    );

    this.router.post(
      "/:id/contacts",
      zodValidate(PartnerParamsSchema, "params"),
      zodValidate(PartnerContactSchema, "body"),
      permissionMiddleware("partner", "update"),
      this.controller.createContact,
    );

    this.router.put(
      "/:id/contacts/:contactId",
      zodValidate(ContactParamsSchema, "params"),
      zodValidate(PartnerContactSchema, "body"),
      permissionMiddleware("partner", "update"),
      this.controller.updateContact,
    );

    this.router.delete(
      "/:id/contacts/:contactId",
      zodValidate(ContactParamsSchema, "params"),
      permissionMiddleware("partner", "update"),
      this.controller.deleteContact,
    );
  }

  public getRouter(): Router {
    return this.router;
  }

  public getPublicRouter(): Router {
    const publicRouter = Router();
    publicRouter.get(
      "/tax-code/:taxCode",
      zodValidate(PartnerPublicParamsSchema, "params"),
      this.controller.getPublicByTaxCode,
    );
    return publicRouter;
  }
}
