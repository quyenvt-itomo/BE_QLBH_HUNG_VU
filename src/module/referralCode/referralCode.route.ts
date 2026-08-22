import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { REFERRAL_CODE_TYPES } from "./referralCode.types";
import { ReferralCodeController } from "./referralCode.controller";
import {
  CreateReferralCodeSchema,
  ReferralCodeQuerySchema,
  ReferralCodePublicParamsSchema,
} from "./referralCode.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class ReferralCodeRouter {
  private router: Router;

  constructor(
    @inject(REFERRAL_CODE_TYPES.ReferralCodeController)
    private controller: ReferralCodeController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Protected: list & create
    this.router.get(
      "/",
      permissionMiddleware("purchaseRequisition", "read"),
      zodValidate(ReferralCodeQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      permissionMiddleware("purchaseRequisition", "read"),
      zodValidate(CreateReferralCodeSchema, "body"),
      this.controller.create,
    );

    // bind referral code to partner (admin action)
    this.router.post("/:id/bind-to-partner", this.controller.bindToPartner);
  }

  public getRouter(): Router {
    return this.router;
  }

  /** Public route — không cần auth */
  public getPublicRouter(): Router {
    const publicRouter = Router();
    publicRouter.get(
      "/code/:code",
      zodValidate(ReferralCodePublicParamsSchema, "params"),
      this.controller.decodePublic,
    );
    return publicRouter;
  }
}
