import { DebtAdjustmentController } from "./debtAdjustment.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class DebtAdjustmentRouter { constructor(private readonly controller: DebtAdjustmentController) {} getRouter() { return simpleRoutes(this.controller, "debtAdjustment"); } }
