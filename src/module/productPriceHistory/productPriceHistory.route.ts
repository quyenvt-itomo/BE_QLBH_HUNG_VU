import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { ProductPriceHistoryController } from "./productPriceHistory.controller";
import { PRODUCT_PRICE_HISTORY_TYPES } from "./productPriceHistory.types";
@injectable()
export class ProductPriceHistoryRouter { private router = Router(); constructor(@inject(PRODUCT_PRICE_HISTORY_TYPES.Controller) controller: ProductPriceHistoryController) { this.router.get("/", permissionMiddleware("product", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("product", "read"), controller.getById); } getRouter() { return this.router; } }
