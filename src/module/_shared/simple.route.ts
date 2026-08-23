import { Router } from "express";
import { permissionMiddleware, Module } from "@/shared/middleware/permission.middleware";
import { SimpleController } from "./simple.controller";
import { BaseEntity } from "@/shared/base/BaseEntity";

export function simpleRoutes<T extends BaseEntity>(controller: any, permission: Module): Router {
  const router = Router();
  router.get("/", permissionMiddleware(permission, "read"), controller.getAllWithPagination);
  router.get("/:id", permissionMiddleware(permission, "read"), controller.getById);
  router.post("/", permissionMiddleware(permission, "create"), controller.create);
  router.put("/:id", permissionMiddleware(permission, "update"), controller.update);
  router.patch("/:id", permissionMiddleware(permission, "update"), controller.update);
  router.delete("/bulk", permissionMiddleware(permission, "delete"), controller.deleteMany);
  router.delete("/", permissionMiddleware(permission, "delete"), controller.deleteMany);
  router.delete("/:id", permissionMiddleware(permission, "delete"), controller.delete);
  return router;
}
