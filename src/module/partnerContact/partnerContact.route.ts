import { Router } from "express";
import { injectable, inject } from "inversify";
import { PartnerContactController } from "./partnerContact.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePartnerContactSchema,
  UpdatePartnerContactSchema,
  PartnerContactQuerySchema,
  PartnerContactParamsSchema,
} from "./partnerContact.validator";
import { PARTNER_CONTACT_TYPES } from "./partnerContact.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PartnerContactRouter {
  private router: Router;

  constructor(
    @inject(PARTNER_CONTACT_TYPES.PartnerContactController)
    private controller: PartnerContactController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PartnerContactQuerySchema, "query"),
      permissionMiddleware("partner", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      zodValidate(CreatePartnerContactSchema, "body"),
      permissionMiddleware("partner", "update"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(PartnerContactParamsSchema, "params"),
      permissionMiddleware("partner", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(PartnerContactParamsSchema, "params"),
      zodValidate(UpdatePartnerContactSchema, "body"),
      permissionMiddleware("partner", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(PartnerContactParamsSchema, "params"),
      permissionMiddleware("partner", "update"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
