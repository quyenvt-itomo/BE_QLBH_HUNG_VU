import { injectable, inject } from "inversify";
import { FundAdjustmentService } from "./fundAdjustment.service";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
import { BaseController } from "@/shared/base/BaseController";
import { FundAdjustment } from "@/database/models/FundAdjustment";

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
