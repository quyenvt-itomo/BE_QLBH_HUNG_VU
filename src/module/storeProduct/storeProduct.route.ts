import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { StoreProductController } from "./storeProduct.controller";
import { STORE_PRODUCT_TYPES } from "./storeProduct.types";
@injectable()
export class StoreProductRouter { private router = Router(); constructor(@inject(STORE_PRODUCT_TYPES.Controller) controller: StoreProductController) { this.router.get("/", permissionMiddleware("product", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("product", "read"), controller.getById); this.router.put("/:id", permissionMiddleware("product", "update"), controller.update); } getRouter() { return this.router; } }
