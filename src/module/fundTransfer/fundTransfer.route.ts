import { FundTransferController } from "./fundTransfer.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class FundTransferRouter { constructor(private readonly controller: FundTransferController) {} getRouter() { return simpleRoutes(this.controller, "fundTransfer"); } }
