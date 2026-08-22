import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { JOB_POSITION_TYPES } from "./jobPosition.types";
import { JobPositionController } from "./jobPosition.controller";
import {
  CreateJobPositionSchema,
  JobPositionParamsSchema,
  JobPositionQuerySchema,
  UpdateJobPositionSchema,
} from "./jobPosition.validator";

@injectable()
export class JobPositionRouter {
  private router: Router;

  constructor(
    @inject(JOB_POSITION_TYPES.JobPositionController)
    private jobPositionController: JobPositionController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      permissionMiddleware("jobPosition", "read"),
      zodValidate(JobPositionQuerySchema, "query"),
      this.jobPositionController.getAllWithPagination,
    );

    this.router.post(
      "/",
      permissionMiddleware("jobPosition", "create"),
      zodValidate(CreateJobPositionSchema, "body"),
      this.jobPositionController.create,
    );

    this.router.get(
      "/:id",
      permissionMiddleware("jobPosition", "read"),
      zodValidate(JobPositionParamsSchema, "params"),
      this.jobPositionController.getById,
    );

    this.router.put(
      "/:id",
      permissionMiddleware("jobPosition", "update"),
      zodValidate(JobPositionParamsSchema, "params"),
      zodValidate(UpdateJobPositionSchema, "body"),
      this.jobPositionController.update,
    );

    this.router.delete(
      "/:id",
      permissionMiddleware("jobPosition", "delete"),
      zodValidate(JobPositionParamsSchema, "params"),
      this.jobPositionController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
