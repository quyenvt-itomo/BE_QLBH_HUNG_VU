import { zodValidate } from "@/shared/middleware/validation.middleware";
import { Router } from "express";
import { inject, injectable } from "inversify";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserParamsSchema,
  UserQuerySchema,
} from "./user.validator";
import { USER_TYPES } from "./user.types";
import { UserController } from "./user.controller";

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
    // All role routes require authentication
    // this.router.use(authenticate);

    // GET /roles - Get all roles with filters
    this.router.get(
      "/",
      zodValidate(UserQuerySchema, "query"),
      this.userController.getAllWithPagination,
    );

    // POST /roles - Create new role
    this.router.post(
      "/",
      zodValidate(CreateUserSchema, "body"),
      this.userController.create,
    );

    // GET /roles/:id - Get role by ID
    this.router.get(
      "/:id",
      zodValidate(UserParamsSchema, "params"),
      this.userController.getById,
    );

    // PUT /roles/:id - Update role
    this.router.put(
      "/:id",
      zodValidate(UserParamsSchema, "params"),
      zodValidate(UpdateUserSchema, "body"),
      this.userController.update,
    );

    // DELETE /roles/:id - Delete role
    this.router.delete(
      "/:id",
      zodValidate(UserParamsSchema, "params"),
      this.userController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
