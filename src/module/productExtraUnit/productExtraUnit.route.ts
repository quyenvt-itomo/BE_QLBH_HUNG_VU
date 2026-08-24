import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { ProductExtraUnitController } from "./productExtraUnit.controller";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";
@injectable()
export class ProductExtraUnitRouter { private router = Router(); constructor(@inject(PRODUCT_EXTRA_UNIT_TYPES.Controller) controller: ProductExtraUnitController) { this.router.get("/", permissionMiddleware("product", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("product", "read"), controller.getById); this.router.post("/", permissionMiddleware("product", "update"), controller.create); this.router.put("/:id", permissionMiddleware("product", "update"), controller.update); this.router.delete("/:id", permissionMiddleware("product", "update"), controller.delete); } getRouter() { return this.router; } }
