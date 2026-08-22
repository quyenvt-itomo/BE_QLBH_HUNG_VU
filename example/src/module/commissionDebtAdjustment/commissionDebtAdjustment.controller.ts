import { injectable, inject } from "inversify";
import { CommissionDebtAdjustmentService } from "./commissionDebtAdjustment.service";
import { COMMISSION_DEBT_ADJUSTMENT_TYPES } from "./commissionDebtAdjustment.types";
import { BaseController } from "@/shared/base/BaseController";
import { CommissionDebtAdjustment } from "@/database/models/company/CommissionDebtAdjustment";

@injectable()
export class CommissionDebtAdjustmentController extends BaseController<CommissionDebtAdjustment> {
  protected service: CommissionDebtAdjustmentService;

  constructor(
    @inject(COMMISSION_DEBT_ADJUSTMENT_TYPES.CommissionDebtAdjustmentService)
    service: CommissionDebtAdjustmentService,
  ) {
    super();
    this.service = service;
  }
}
