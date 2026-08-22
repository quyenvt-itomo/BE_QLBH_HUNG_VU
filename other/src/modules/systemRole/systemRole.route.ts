import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateRoleSchema,
  UpdateRoleSchema,
  RoleQuerySchema,
  RoleParamsSchema,
} from "./systemRole.validator";
import { SystemRoleController } from "./systemRole.controller";
import { SYSTEM_ROLE_TYPES } from "./systemRole.types";

@injectable()
export class SystemRoleRouter {
  private router: Router;

  constructor(
    @inject(SYSTEM_ROLE_TYPES.SystemRoleController)
    private controller: SystemRoleController,
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
      zodValidate(RoleQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );

    // POST /roles - Create new role
    this.router.post(
      "/",
      zodValidate(CreateRoleSchema, "body"),
      this.controller.create,
    );

    // GET /roles/:id - Get role by ID
    this.router.get(
      "/:id",
      zodValidate(RoleParamsSchema, "params"),
      this.controller.getById,
    );

    // PUT /roles/:id - Update role
    this.router.put(
      "/:id",
      zodValidate(RoleParamsSchema, "params"),
      zodValidate(UpdateRoleSchema, "body"),
      this.controller.update,
    );

    // DELETE /roles/:id - Delete role
    this.router.delete(
      "/:id",
      zodValidate(RoleParamsSchema, "params"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
