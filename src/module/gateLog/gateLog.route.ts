import { Router } from "express";
import { injectable, inject } from "inversify";
import { GateLogController } from "./gateLog.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateGateLogSchema,
  UpdateGateLogSchema,
  GateLogQuerySchema,
  GateLogParamsSchema,
  GateEntrySchema,
  GateExitSchema,
  LinkGateLogSchema,
} from "./gateLog.validator";
import { GATE_LOG_TYPES } from "./gateLog.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class GateLogRouter {
  private router: Router;

  constructor(
    @inject(GATE_LOG_TYPES.GateLogController)
    private controller: GateLogController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(GateLogQuerySchema, "query"),
      permissionMiddleware("gateLog", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateGateLogSchema, "body"),
      permissionMiddleware("gateLog", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(GateLogParamsSchema, "params"),
      permissionMiddleware("gateLog", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(GateLogParamsSchema, "params"),
      zodValidate(UpdateGateLogSchema, "body"),
      permissionMiddleware("gateLog", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(GateLogParamsSchema, "params"),
      permissionMiddleware("gateLog", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/enter",
      zodValidate(GateLogParamsSchema, "params"),
      zodValidate(GateEntrySchema, "body"),
      permissionMiddleware("gateLog", "enter"),
      this.controller.enter,
    );

    this.router.post(
      "/:id/exit",
      zodValidate(GateLogParamsSchema, "params"),
      zodValidate(GateExitSchema, "body"),
      permissionMiddleware("gateLog", "exit"),
      this.controller.exit,
    );

    this.router.post(
      "/:id/link",
      zodValidate(GateLogParamsSchema, "params"),
      zodValidate(LinkGateLogSchema, "body"),
      permissionMiddleware("gateLog", "link"),
      this.controller.link,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
