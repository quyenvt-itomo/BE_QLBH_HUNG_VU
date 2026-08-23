import { StoreTransferController } from "./storeTransfer.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class StoreTransferRouter { constructor(private readonly controller: StoreTransferController) {} getRouter() { return simpleRoutes(this.controller, "storeTransfer"); } }
