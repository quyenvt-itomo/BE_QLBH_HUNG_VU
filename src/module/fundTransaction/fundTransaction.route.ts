import { FundTransactionController } from "./fundTransaction.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class FundTransactionRouter { constructor(private readonly controller: FundTransactionController) {} getRouter() { return simpleRoutes(this.controller, "fund"); } }
