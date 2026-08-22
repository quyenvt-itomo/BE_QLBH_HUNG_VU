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
    this.router.get(
      "/",
      zodValidate(PartnerDebtOffsetQuerySchema, "query"),
      permissionMiddleware("partnerDebtOffset", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreatePartnerDebtOffsetSchema, "body"),
      permissionMiddleware("partnerDebtOffset", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(PartnerDebtOffsetParamsSchema, "params"),
      permissionMiddleware("partnerDebtOffset", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(PartnerDebtOffsetParamsSchema, "params"),
      zodValidate(UpdatePartnerDebtOffsetSchema, "body"),
      permissionMiddleware("partnerDebtOffset", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PartnerDebtOffsetParamsSchema, "params"),
      permissionMiddleware("partnerDebtOffset", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
