import { Router } from "express";
import { injectable, inject } from "inversify";
import { PartnerContactController } from "./partnerContact.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreatePartnerContactSchema,
  UpdatePartnerContactSchema,
  PartnerContactParamsSchema,
  PartnerContactCreateParamsSchema,
  PartnerContactQuerySchema,
} from "./partnerContact.validator";
import { PARTNER_CONTACT_TYPES } from "./partnerContact.types";

@injectable()
export class PartnerContactRouter {
  private router: Router;

  constructor(
    @inject(PARTNER_CONTACT_TYPES.PartnerContactController)
    private partnerContactController: PartnerContactController,
  ) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/",
      zodValidate(PartnerContactCreateParamsSchema, "params"),
      zodValidate(CreatePartnerContactSchema, "body"),
      this.partnerContactController.create,
    );

    this.router.put(
      "/:id",
      zodValidate(PartnerContactParamsSchema, "params"),
      zodValidate(UpdatePartnerContactSchema, "body"),
      this.partnerContactController.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PartnerContactParamsSchema, "params"),
      this.partnerContactController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }

  // Return a read-only router exposing only GET list and GET by id
  public getReadOnlyRouter(): Router {
    const r = Router({ mergeParams: true });

    r.get(
      "/",
      zodValidate(PartnerContactQuerySchema, "query"),
      this.partnerContactController.getAllWithPagination,
    );

    r.get(
      "/:id",
      zodValidate(PartnerContactParamsSchema, "params"),
      this.partnerContactController.getById,
    );

    return r;
  }
}
