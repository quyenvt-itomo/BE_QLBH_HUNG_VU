import { Router } from "express";
import { injectable, inject } from "inversify";
import { QuotationLineController } from "./quotationLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateQuotationLineSchema,
  UpdateQuotationLineSchema,
  QuotationLineQuerySchema,
  QuotationLineParamsSchema,
} from "./quotationLine.validator";
import { QUOTATION_LINE_TYPES } from "./quotationLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class QuotationLineRouter {
  private router: Router;

  constructor(
    @inject(QUOTATION_LINE_TYPES.QuotationLineController)
    private controller: QuotationLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(QuotationLineQuerySchema, "query"),
      permissionMiddleware("quotation", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateQuotationLineSchema, "body"),
      permissionMiddleware("quotation", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(QuotationLineParamsSchema, "params"),
      permissionMiddleware("quotation", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(QuotationLineParamsSchema, "params"),
      zodValidate(UpdateQuotationLineSchema, "body"),
      permissionMiddleware("quotation", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(QuotationLineParamsSchema, "params"),
      permissionMiddleware("quotation", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
