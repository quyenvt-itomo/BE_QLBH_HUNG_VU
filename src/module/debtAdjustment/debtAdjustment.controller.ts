import { DebtAdjustment } from "@/database/models/DebtAdjustment";
import { SimpleController } from "../_shared/simple.controller";
import { DebtAdjustmentService } from "./debtAdjustment.service";
export class DebtAdjustmentController extends SimpleController<DebtAdjustment> { constructor(service: DebtAdjustmentService) { super(service); } }
