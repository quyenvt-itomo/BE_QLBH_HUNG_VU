import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { RoleController } from "./role.controller";
import { ROLE_TYPES } from "./role.types";
import {
  CreateRoleSchema,
  RoleQuerySchema,
  UpdateRoleSchema,
} from "./role.validator";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { BaseParamsSchema } from "@/shared/base/BaseValidator";
@injectable()
export class RoleRouter {
  private router = Router();
  constructor(@inject(ROLE_TYPES.Controller) controller: RoleController) {
    this.router.get(
      "/",
      zodValidate(RoleQuerySchema, "query"),
      permissionMiddleware("role", "read"),
      controller.getAllWithPagination,
    );
    this.router.get(
      "/:id",
      zodValidate(RoleQuerySchema, "query"),
      permissionMiddleware("role", "read"),
      controller.getById,
    );
    this.router.post(
      "/",
      zodValidate(CreateRoleSchema, "body"),
      permissionMiddleware("role", "create"),
      controller.create,
    );
    this.router.put(
      "/:id",
      zodValidate(BaseParamsSchema, "params"),
      zodValidate(UpdateRoleSchema, "body"),
      permissionMiddleware("role", "update"),
      controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(BaseParamsSchema, "params"),
      permissionMiddleware("role", "delete"),
      controller.delete,
    );
  }
  getRouter() {
    return this.router;
  }
}
