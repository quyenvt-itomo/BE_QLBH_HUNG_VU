import { Router } from "express";
import { injectable, inject } from "inversify";
import { QuotationRequestController } from "./quotationRequest.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateQuotationRequestSchema,
  QuotationRequestQuerySchema,
  QuotationRequestParamsSchema,
  ApproveRejectSchema,
  QuotationRequestPublicParamsSchema,
} from "./quotationRequest.validator";
import { QUOTATION_REQUEST_TYPES } from "./quotationRequest.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { companyResolver } from "@/shared/middleware/company.middleware";

@injectable()
export class QuotationRequestRouter {
  private router: Router;

  constructor(
    @inject(QUOTATION_REQUEST_TYPES.QuotationRequestController)
    private controller: QuotationRequestController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ---- PUBLIC routes (khách hàng từ bên ngoài) ----
    // Tạo đề nghị báo giá từ trang public
    this.router.post(
      "/public",
      companyResolver,
      zodValidate(CreateQuotationRequestSchema, "body"),
      this.controller.create,
    );

    // ---- INTERNAL routes (nội bộ) ----
    this.router.get(
      "/",
      zodValidate(QuotationRequestQuerySchema, "query"),
      permissionMiddleware("quotationRequest", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.get(
      "/:id",
      zodValidate(QuotationRequestParamsSchema, "params"),
      permissionMiddleware("quotationRequest", "read"),
      this.controller.getById,
    );

    // Nội bộ KHÔNG sửa nội dung đề nghị báo giá của khách hàng
    // this.router.put("/:id", ...) - Ẩn

    this.router.delete(
      "/:id",
      zodValidate(QuotationRequestParamsSchema, "params"),
      permissionMiddleware("quotationRequest", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/approve",
      zodValidate(QuotationRequestParamsSchema, "params"),
      zodValidate(ApproveRejectSchema, "body"),
      permissionMiddleware("quotationRequest", "approve"),
      this.controller.approve,
    );

    this.router.post(
      "/:id/reject",
      zodValidate(QuotationRequestParamsSchema, "params"),
      zodValidate(ApproveRejectSchema, "body"),
      permissionMiddleware("quotationRequest", "approve"),
      this.controller.reject,
    );
  }

  public getRouter(): Router {
    return this.router;
  }

  public getPublicRouter(): Router {
    const publicRouter = Router();
    publicRouter.post(
      "/",
      companyResolver,
      zodValidate(CreateQuotationRequestSchema, "body"),
      this.controller.create,
    );
    publicRouter.get(
      "/code/:code",
      zodValidate(QuotationRequestPublicParamsSchema, "params"),
      this.controller.getByCode,
    );
    return publicRouter;
  }
}
