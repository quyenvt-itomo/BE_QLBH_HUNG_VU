import { inject, injectable } from "inversify";
import { DebtAdjustment } from "@/database/models/DebtAdjustment";
import { BaseController } from "@/shared/base/BaseController";
import { DebtAdjustmentService } from "./debtAdjustment.service";
import { DEBT_ADJUSTMENT_TYPES } from "./debtAdjustment.types";
@injectable()
export class DebtAdjustmentController extends BaseController<DebtAdjustment> {
  protected service: DebtAdjustmentService;
  constructor(@inject(DEBT_ADJUSTMENT_TYPES.Service) service: DebtAdjustmentService) { super(); this.service = service; }
}
