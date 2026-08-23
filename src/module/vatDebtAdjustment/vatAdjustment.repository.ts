import { VatAdjustment } from "@/database/models/VatDebtAdjustment";
import { SimpleRepository } from "../_shared/simple.repository";
export class VatAdjustmentRepository extends SimpleRepository<VatAdjustment> { constructor() { super(VatAdjustment); } }
