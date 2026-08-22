import { zodValidate } from "@/shared/middleware/validation.middleware";
import { Router } from "express";
import { inject, injectable } from "inversify";
import { ROLE_TYPES } from "./role.types";
import { RoleController } from "./role.controller";
import {
  CreateRoleSchema,
  RoleParamsSchema,
  RoleQuerySchema,
  UpdateRoleSchema,
} from "./role.validator";

@injectable()
export class RoleRouter {
  private router: Router;

  constructor(
    @inject(ROLE_TYPES.RoleController)
    private roleController: RoleController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(RoleQuerySchema, "query"),
      this.roleController.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateRoleSchema, "body"),
      this.roleController.create,
    );

    this.router.get(
      "/:id",
      zodValidate(RoleParamsSchema, "params"),
      this.roleController.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(RoleParamsSchema, "params"),
      zodValidate(UpdateRoleSchema, "body"),
      this.roleController.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(RoleParamsSchema, "params"),
      this.roleController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
