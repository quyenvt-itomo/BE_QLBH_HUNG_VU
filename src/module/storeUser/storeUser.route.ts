import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { StoreUserController } from "./storeUser.controller";
import { STORE_USER_TYPES } from "./storeUser.types";
@injectable()
export class StoreUserRouter { private router = Router(); constructor(@inject(STORE_USER_TYPES.Controller) controller: StoreUserController) { this.router.get("/", permissionMiddleware("user", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("user", "read"), controller.getById); this.router.post("/", permissionMiddleware("user", "update"), controller.create); this.router.delete("/:id", permissionMiddleware("user", "update"), controller.delete); } getRouter() { return this.router; } }
