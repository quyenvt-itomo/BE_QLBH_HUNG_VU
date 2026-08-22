import { Router } from "express";
import { injectable, inject } from "inversify";
import { PaymentRequestController } from "./paymentRequest.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePaymentRequestSchema,
  UpdatePaymentRequestSchema,
  PaymentRequestQuerySchema,
  PaymentRequestParamsSchema,
  RejectPaymentRequestSchema,
} from "./paymentRequest.validator";
import { PAYMENT_REQUEST_TYPES } from "./paymentRequest.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PaymentRequestRouter {
  private router: Router;

  constructor(
    @inject(PAYMENT_REQUEST_TYPES.PaymentRequestController)
    private controller: PaymentRequestController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PaymentRequestQuerySchema, "query"),
      permissionMiddleware("paymentRequest", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreatePaymentRequestSchema, "body"),
      permissionMiddleware("paymentRequest", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(PaymentRequestParamsSchema, "params"),
      permissionMiddleware("paymentRequest", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(PaymentRequestParamsSchema, "params"),
      zodValidate(UpdatePaymentRequestSchema, "body"),
      permissionMiddleware("paymentRequest", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PaymentRequestParamsSchema, "params"),
      permissionMiddleware("paymentRequest", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/approve",
      zodValidate(PaymentRequestParamsSchema, "params"),
      permissionMiddleware("paymentRequest", "approve"),
      this.controller.approve,
    );

    this.router.post(
      "/:id/reject",
      zodValidate(PaymentRequestParamsSchema, "params"),
      zodValidate(RejectPaymentRequestSchema, "body"),
      permissionMiddleware("paymentRequest", "approve"),
      this.controller.reject,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
