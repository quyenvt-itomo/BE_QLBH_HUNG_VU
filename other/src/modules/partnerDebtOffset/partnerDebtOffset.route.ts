import { Router } from "express";
import { injectable, inject } from "inversify";
import { PartnerDebtOffsetController } from "./partnerDebtOffset.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreatePartnerDebtOffsetSchema,
  UpdatePartnerDebtOffsetSchema,
  PartnerDebtOffsetQuerySchema,
  PartnerDebtOffsetParamsSchema,
} from "./partnerDebtOffset.validator";
import { PARTNER_DEBT_OFFSET_TYPES } from "./partnerDebtOffset.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PartnerDebtOffsetRouter {
  private router: Router;

  constructor(
    @inject(PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetController)
    private controller: PartnerDebtOffsetController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /partner-debt/offset - Get all partner with filters
    this.router.get(
      "/",
      zodValidate(PartnerDebtOffsetQuerySchema, "query"),
      permissionMiddleware("debtOffset", "read"),
      this.controller.getAllWithPagination,
    );

    // POST /partner-debt/offset - Create new partner
    this.router.post(
      "/",
      zodValidate(CreatePartnerDebtOffsetSchema, "body"),
      permissionMiddleware("debtOffset", "create"),
      this.controller.create,
    );

    // GET /partner-debt/offset/:id - Get partner by ID
    this.router.get(
      "/:id",
      zodValidate(PartnerDebtOffsetParamsSchema, "params"),
      permissionMiddleware("debtOffset", "read"),
      this.controller.getById,
    );

    // PUT /partner-debt/offset/:id - Update partner
    this.router.put(
      "/:id",
      zodValidate(PartnerDebtOffsetParamsSchema, "params"),
      zodValidate(UpdatePartnerDebtOffsetSchema, "body"),
      permissionMiddleware("debtOffset", "update"),
      this.controller.update,
    );

    // DELETE /partner-debt/offset/:id - Delete partner
    this.router.delete(
      "/:id",
      zodValidate(PartnerDebtOffsetParamsSchema, "params"),
      permissionMiddleware("debtOffset", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
