import { VatAdjustmentController } from "./vatAdjustment.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class VatAdjustmentRouter { constructor(private readonly controller: VatAdjustmentController) {} getRouter() { return simpleRoutes(this.controller, "vatAdjustment"); } }
