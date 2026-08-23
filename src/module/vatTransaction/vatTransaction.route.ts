import { VatTransactionController } from "./vatTransaction.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class VatTransactionRouter { constructor(private readonly controller: VatTransactionController) {} getRouter() { return simpleRoutes(this.controller, "vatAdjustment"); } }
