import { Router } from "express";
import { injectable, inject } from "inversify";
import { LoginApprovalController } from "./loginApproval.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  LoginApprovalQuerySchema,
  LoginApprovalParamsSchema,
} from "./loginApproval.validator";
import { LOGIN_APPROVAL_TYPES } from "./loginApproval.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class LoginApprovalRouter {
  private router: Router;

  constructor(
    @inject(LOGIN_APPROVAL_TYPES.LoginApprovalController)
    private controller: LoginApprovalController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // List pending approvals for the current company
    this.router.get(
      "/",
      zodValidate(LoginApprovalQuerySchema, "query"),
      permissionMiddleware("loginApproval", "read"),
      this.controller.getAllWithPagination,
    );

    // Approve a login request
    this.router.put(
      "/:id/approve",
      zodValidate(LoginApprovalParamsSchema, "params"),
      permissionMiddleware("loginApproval", "approve"),
      this.controller.approve,
    );

    // Reject a login request
    this.router.put(
      "/:id/reject",
      zodValidate(LoginApprovalParamsSchema, "params"),
      permissionMiddleware("loginApproval", "approve"),
      this.controller.reject,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
