import { Router } from "express";
import { injectable, inject } from "inversify";
import { QuotationRequestLineController } from "./quotationRequestLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateQuotationRequestLineSchema,
  UpdateQuotationRequestLineSchema,
  QuotationRequestLineQuerySchema,
  QuotationRequestLineParamsSchema,
} from "./quotationRequestLine.validator";
import { QUOTATION_REQUEST_LINE_TYPES } from "./quotationRequestLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class QuotationRequestLineRouter {
  private router: Router;

  constructor(
    @inject(QUOTATION_REQUEST_LINE_TYPES.QuotationRequestLineController)
    private controller: QuotationRequestLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(QuotationRequestLineQuerySchema, "query"),
      permissionMiddleware("quotationRequest", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateQuotationRequestLineSchema, "body"),
      permissionMiddleware("quotationRequest", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(QuotationRequestLineParamsSchema, "params"),
      permissionMiddleware("quotationRequest", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(QuotationRequestLineParamsSchema, "params"),
      zodValidate(UpdateQuotationRequestLineSchema, "body"),
      permissionMiddleware("quotationRequest", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(QuotationRequestLineParamsSchema, "params"),
      permissionMiddleware("quotationRequest", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
