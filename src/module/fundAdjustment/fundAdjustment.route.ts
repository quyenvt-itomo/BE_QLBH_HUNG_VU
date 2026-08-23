import { FundAdjustmentController } from "./fundAdjustment.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class FundAdjustmentRouter { constructor(private readonly controller: FundAdjustmentController) {} getRouter() { return simpleRoutes(this.controller, "fundAdjustment"); } }
