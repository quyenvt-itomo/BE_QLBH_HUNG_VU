import { injectable, inject } from "inversify";
import { VatDebtAdjustmentService } from "./vatDebtAdjustment.service";
import { VAT_DEBT_ADJUSTMENT_TYPES } from "./vatDebtAdjustment.types";
import { BaseController } from "@/shared/base/BaseController";
import { VatDebtAdjustment } from "@/database/models/store/VatDebtAdjustment";

/**
 * VatDebtAdjustment Controller - Tenant Entity
 */
@injectable()
export class VatDebtAdjustmentController extends BaseController<VatDebtAdjustment> {
  protected service: VatDebtAdjustmentService;

  constructor(
    @inject(VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentService)
    service: VatDebtAdjustmentService,
  ) {
    super();
    this.service = service;
  }
}
