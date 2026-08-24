import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { RoleController } from "./role.controller";
import { ROLE_TYPES } from "./role.types";
@injectable()
export class RoleRouter { private router = Router(); constructor(@inject(ROLE_TYPES.Controller) controller: RoleController) { this.router.get("/", permissionMiddleware("role", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("role", "read"), controller.getById); this.router.post("/", permissionMiddleware("role", "create"), controller.create); this.router.put("/:id", permissionMiddleware("role", "update"), controller.update); this.router.delete("/:id", permissionMiddleware("role", "delete"), controller.delete); } getRouter() { return this.router; } }
