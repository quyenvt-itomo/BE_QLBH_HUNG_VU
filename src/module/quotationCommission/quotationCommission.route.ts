import { Router } from "express";
import { injectable, inject } from "inversify";
import { QuotationCommissionController } from "./quotationCommission.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateQuotationCommissionSchema,
  UpdateQuotationCommissionSchema,
  QuotationCommissionQuerySchema,
  QuotationCommissionParamsSchema,
} from "./quotationCommission.validator";
import { QUOTATION_COMMISSION_TYPES } from "./quotationCommission.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class QuotationCommissionRouter {
  private router: Router;

  constructor(
    @inject(QUOTATION_COMMISSION_TYPES.QuotationCommissionController)
    private controller: QuotationCommissionController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(QuotationCommissionQuerySchema, "query"),
      permissionMiddleware("quotation", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateQuotationCommissionSchema, "body"),
      permissionMiddleware("quotation", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(QuotationCommissionParamsSchema, "params"),
      permissionMiddleware("quotation", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(QuotationCommissionParamsSchema, "params"),
      zodValidate(UpdateQuotationCommissionSchema, "body"),
      permissionMiddleware("quotation", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(QuotationCommissionParamsSchema, "params"),
      permissionMiddleware("quotation", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
