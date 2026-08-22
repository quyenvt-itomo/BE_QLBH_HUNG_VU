import { zodValidate } from "@/shared/middleware/validation.middleware";
import { Router } from "express";
import { inject, injectable } from "inversify";
import {
  AssignCompanyUserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserParamsSchema,
  UserQuerySchema,
} from "./user.validator";
import { USER_TYPES } from "./user.types";
import { UserController } from "./user.controller";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class UserRouter {
  private router: Router;

  constructor(
    @inject(USER_TYPES.UserController)
    private userController: UserController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      permissionMiddleware("user", "read"),
      zodValidate(UserQuerySchema, "query"),
      this.userController.getAllWithPagination,
    );

    this.router.post(
      "/",
      permissionMiddleware("user", "create"),
      zodValidate(CreateUserSchema, "body"),
      this.userController.create,
    );

    this.router.get(
      "/:id",
      permissionMiddleware("user", "read"),
      zodValidate(UserParamsSchema, "params"),
      this.userController.getById,
    );

    // this.router.put(
    //   "/:id/permission",
    // permissionMiddleware("user", "update"),
    // zodValidate(UserParamsSchema, "params"),
    // zodValidate(UpdateUserSchema, "body"),
    // );

    this.router.put(
      "/:id",
      permissionMiddleware("user", "update"),
      zodValidate(UserParamsSchema, "params"),
      zodValidate(UpdateUserSchema, "body"),
      this.userController.update,
    );

    this.router.delete(
      "/:id",
      permissionMiddleware("user", "delete"),
      zodValidate(UserParamsSchema, "params"),
      this.userController.delete,
    );

    // Cho phép công ty liên kết cập nhật roleId & employeeId
    this.router.put(
      "/:id/assign-company",
      permissionMiddleware("user", "update"),
      zodValidate(UserParamsSchema, "params"),
      zodValidate(AssignCompanyUserSchema, "body"),
      this.userController.assignCompanyUser,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
