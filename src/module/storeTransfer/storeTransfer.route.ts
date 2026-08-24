import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { StoreTransferController } from "./storeTransfer.controller";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";
@injectable()
export class StoreTransferRouter { private router = Router(); constructor(@inject(STORE_TRANSFER_TYPES.Controller) controller: StoreTransferController) { this.router.get("/", permissionMiddleware("storeTransfer", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("storeTransfer", "read"), controller.getById); this.router.post("/", permissionMiddleware("storeTransfer", "create"), controller.create); this.router.put("/:id", permissionMiddleware("storeTransfer", "update"), controller.update); this.router.delete("/:id", permissionMiddleware("storeTransfer", "delete"), controller.delete); } getRouter() { return this.router; } }
