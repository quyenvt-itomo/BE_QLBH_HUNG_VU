import { ProductPriceHistoryController } from "./productPriceHistory.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class ProductPriceHistoryRouter { constructor(private readonly controller: ProductPriceHistoryController) {} getRouter() { return simpleRoutes(this.controller, "product"); } }
