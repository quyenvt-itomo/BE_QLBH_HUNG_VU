import { FundController } from "./fund.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class FundRouter { constructor(private readonly controller: FundController) {} getRouter() { return simpleRoutes(this.controller, "fund"); } }
