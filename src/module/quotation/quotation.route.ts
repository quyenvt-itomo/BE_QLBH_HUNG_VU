import { Router } from "express";
import { injectable, inject } from "inversify";
import { QuotationController } from "./quotation.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateQuotationSchema,
  UpdateQuotationSchema,
  QuotationQuerySchema,
  QuotationParamsSchema,
  StaffApproveSchema,
} from "./quotation.validator";
import { QUOTATION_TYPES } from "./quotation.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class QuotationRouter {
  private router: Router;

  constructor(
    @inject(QUOTATION_TYPES.QuotationController)
    private controller: QuotationController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(QuotationQuerySchema, "query"),
      permissionMiddleware("quotation", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateQuotationSchema, "body"),
      permissionMiddleware("quotation", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(QuotationParamsSchema, "params"),
      permissionMiddleware("quotation", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(QuotationParamsSchema, "params"),
      zodValidate(UpdateQuotationSchema, "body"),
      permissionMiddleware("quotation", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(QuotationParamsSchema, "params"),
      permissionMiddleware("quotation", "delete"),
      this.controller.delete,
    );

    // Internal approve/reject
    this.router.post(
      "/:id/approve",
      zodValidate(QuotationParamsSchema, "params"),
      permissionMiddleware("quotation", "approve"),
      this.controller.approve,
    );

    this.router.post(
      "/:id/reject",
      zodValidate(QuotationParamsSchema, "params"),
      zodValidate(StaffApproveSchema, "body"),
      permissionMiddleware("quotation", "approve"),
      this.controller.reject,
    );

    // Customer approve/reject (staff acting on behalf of customer)
    this.router.post(
      "/:id/customer-approve",
      zodValidate(QuotationParamsSchema, "params"),
      permissionMiddleware("quotation", "customerApprove"),
      this.controller.customerApprove,
    );

    this.router.post(
      "/:id/customer-reject",
      zodValidate(QuotationParamsSchema, "params"),
      zodValidate(StaffApproveSchema, "body"),
      permissionMiddleware("quotation", "customerApprove"),
      this.controller.customerReject,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
