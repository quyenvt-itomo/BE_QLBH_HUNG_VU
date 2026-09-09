import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { InternalExportController } from "./internalExport.controller";
import { INTERNAL_EXPORT_TYPES } from "./internalExport.types";

@injectable()
export class InternalExportRouter {
  private router = Router();
  constructor(@inject(INTERNAL_EXPORT_TYPES.Controller) controller: InternalExportController) {
    this.router.get("/", permissionMiddleware("internalExport", "read"), controller.getAllWithPagination);
    this.router.get("/:id", permissionMiddleware("internalExport", "read"), controller.getById);
    this.router.post("/", permissionMiddleware("internalExport", "create"), controller.create);
    this.router.put("/:id", permissionMiddleware("internalExport", "update"), controller.update);
    this.router.delete("/:id", permissionMiddleware("internalExport", "delete"), controller.delete);
  }
  getRouter() { return this.router; }
}
