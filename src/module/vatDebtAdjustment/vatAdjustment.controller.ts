import { inject, injectable } from "inversify";
import { VatAdjustment } from "@/database/models/VatDebtAdjustment";
import { BaseController } from "@/shared/base/BaseController";
import { VatAdjustmentService } from "./vatAdjustment.service";
import { VAT_ADJUSTMENT_TYPES } from "./vatAdjustment.types";
@injectable()
export class VatAdjustmentController extends BaseController<VatAdjustment> { protected service: VatAdjustmentService; constructor(@inject(VAT_ADJUSTMENT_TYPES.Service) service: VatAdjustmentService) { super(); this.service = service; } }
