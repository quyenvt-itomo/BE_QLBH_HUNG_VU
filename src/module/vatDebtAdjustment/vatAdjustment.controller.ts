import { VatAdjustment } from "@/database/models/VatDebtAdjustment";
import { SimpleController } from "../_shared/simple.controller";
import { VatAdjustmentService } from "./vatAdjustment.service";
export class VatAdjustmentController extends SimpleController<VatAdjustment> { constructor(service: VatAdjustmentService) { super(service); } }
