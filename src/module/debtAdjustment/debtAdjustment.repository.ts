import { DebtAdjustment } from "@/database/models/DebtAdjustment";
import { SimpleRepository } from "../_shared/simple.repository";
export class DebtAdjustmentRepository extends SimpleRepository<DebtAdjustment> { constructor() { super(DebtAdjustment); } }
