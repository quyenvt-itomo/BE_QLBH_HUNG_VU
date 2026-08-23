import { VatAdjustment } from "@/database/models/VatDebtAdjustment";
import { SimpleService } from "../_shared/simple.service";
import { VatAdjustmentRepository } from "./vatAdjustment.repository";
export class VatAdjustmentService extends SimpleService<VatAdjustment> { constructor(repository: VatAdjustmentRepository) { super(repository, "store", "vatadjustment"); } }
