import { inject, injectable } from "inversify";
import { FundAdjustment } from "@/database/models/FundAdjustment";
import { BaseController } from "@/shared/base/BaseController";
import { FundAdjustmentService } from "./fundAdjustment.service";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
@injectable()
export class FundAdjustmentController extends BaseController<FundAdjustment> {
  protected service: FundAdjustmentService;
  constructor(@inject(FUND_ADJUSTMENT_TYPES.Service) service: FundAdjustmentService) { super(); this.service = service; }
}
