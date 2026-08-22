import { injectable, inject } from "inversify";
import { LoyaltyPointAdjustmentService } from "./loyaltyPointAdjustment.service";
import { LOYALTY_POINT_ADJUSTMENT_TYPES } from "./loyaltyPointAdjustment.types";
import { BaseController } from "@/shared/base/BaseController";
import { LoyaltyPointAdjustment } from "@/database/models/LoyaltyPointAdjustment";

/**
 * LoyaltyPointAdjustment Controller
 */
@injectable()
export class LoyaltyPointAdjustmentController extends BaseController<LoyaltyPointAdjustment> {
  protected service: LoyaltyPointAdjustmentService;

  constructor(
    @inject(LOYALTY_POINT_ADJUSTMENT_TYPES.LoyaltyPointAdjustmentService)
    service: LoyaltyPointAdjustmentService,
  ) {
    super();
    this.service = service;
  }
}
