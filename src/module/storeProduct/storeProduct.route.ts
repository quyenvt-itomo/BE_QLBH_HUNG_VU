import { StoreProductController } from "./storeProduct.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class StoreProductRouter { constructor(private readonly controller: StoreProductController) {} getRouter() { return simpleRoutes(this.controller, "product"); } }
