import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { UserController } from "./user.controller";
import { USER_TYPES } from "./user.types";
@injectable()
export class UserRouter { private router = Router(); constructor(@inject(USER_TYPES.Controller) controller: UserController) { this.router.get("/", permissionMiddleware("user", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("user", "read"), controller.getById); this.router.post("/", permissionMiddleware("user", "create"), controller.create); this.router.put("/:id", permissionMiddleware("user", "update"), controller.update); this.router.delete("/:id", permissionMiddleware("user", "delete"), controller.delete); } getRouter() { return this.router; } }
