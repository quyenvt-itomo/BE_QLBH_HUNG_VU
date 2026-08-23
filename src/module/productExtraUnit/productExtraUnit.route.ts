import { ProductExtraUnitController } from "./productExtraUnit.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class ProductExtraUnitRouter { constructor(private readonly controller: ProductExtraUnitController) {} getRouter() { return simpleRoutes(this.controller, "product"); } }
