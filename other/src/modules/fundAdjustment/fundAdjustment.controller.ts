import { FundAdjustment } from "@/database/models/FundAdjustment";
import { BaseController } from "@/shared/base/BaseController";
import { inject, injectable } from "inversify";
import { FundAdjustmentService } from "./fundAdjustment.service";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";

@injectable()
export class FundAdjustmentController extends BaseController<FundAdjustment> {
  protected service: FundAdjustmentService;
  constructor(
    @inject(FUND_ADJUSTMENT_TYPES.FundAdjustmentService)
    service: FundAdjustmentService,
  ) {
    super();
    this.service = service;
  }
}
