import { FundAdjustment } from "@/database/models/FundAdjustment";
import { SimpleRepository } from "../_shared/simple.repository";
export class FundAdjustmentRepository extends SimpleRepository<FundAdjustment> { constructor() { super(FundAdjustment); } }
