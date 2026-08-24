import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { UserController } from "./user.controller";
import { USER_TYPES } from "./user.types";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserParamsSchema,
  UserQuerySchema,
} from "./user.validator";
@injectable()
export class UserRouter {
  private router = Router();

  constructor(
    @inject(USER_TYPES.Controller) controller: UserController,
  ) {
    this.router.get(
      "/",
      zodValidate(UserQuerySchema, "query"),
      permissionMiddleware("user", "read"),
      controller.getAllWithPagination,
    );
    this.router.get(
      "/:id",
      zodValidate(UserParamsSchema, "params"),
      permissionMiddleware("user", "read"),
      controller.getById,
    );
    this.router.post(
      "/",
      zodValidate(CreateUserSchema, "body"),
      permissionMiddleware("user", "create"),
      controller.create,
    );
    this.router.put(
      "/:id",
      zodValidate(UserParamsSchema, "params"),
      zodValidate(UpdateUserSchema, "body"),
      permissionMiddleware("user", "update"),
      controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(UserParamsSchema, "params"),
      permissionMiddleware("user", "delete"),
      controller.delete,
    );
  }

  getRouter() {
    return this.router;
  }
}
