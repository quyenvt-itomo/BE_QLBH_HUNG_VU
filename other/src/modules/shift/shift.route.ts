import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { SHIFT_TYPES } from "./shift.types";
import { ShiftController } from "./shift.controller";
import {
  CloseShiftSchema,
  CreateShiftSchema,
  OpenShiftSchema,
  ShiftParamsSchema,
  ShiftQuerySchema,
  UpdateShiftSchema,
} from "./shift.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class ShiftRouter {
  private router: Router;

  constructor(
    @inject(SHIFT_TYPES.ShiftController)
    private controller: ShiftController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/:id/summary",
      zodValidate(ShiftParamsSchema, "params"),
      this.controller.getShiftSummary,
    );

    this.router.get(
      "/",
      zodValidate(ShiftQuerySchema, "query"),
      permissionMiddleware("shift", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/open",
      zodValidate(OpenShiftSchema, "body"),
      this.controller.openShift,
    );

    this.router.post(
      "/",
      zodValidate(CreateShiftSchema, "body"),
      permissionMiddleware("shift", "create"),
      this.controller.create,
    );

    this.router.post(
      "/:id/close",
      zodValidate(ShiftParamsSchema, "params"),
      zodValidate(CloseShiftSchema, "body"),
      this.controller.closeShift,
    );

    this.router.get(
      "/:id",
      zodValidate(ShiftParamsSchema, "params"),
      permissionMiddleware("shift", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(ShiftParamsSchema, "params"),
      zodValidate(UpdateShiftSchema, "body"),
      permissionMiddleware("shift", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(ShiftParamsSchema, "params"),
      permissionMiddleware("shift", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
