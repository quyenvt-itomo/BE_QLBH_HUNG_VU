import { FundAdjustment } from "@/database/models/FundAdjustment";
import { SimpleController } from "../_shared/simple.controller";
import { FundAdjustmentService } from "./fundAdjustment.service";
export class FundAdjustmentController extends SimpleController<FundAdjustment> { constructor(service: FundAdjustmentService) { super(service); } }
