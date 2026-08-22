import { Router } from "express";
import { injectable, inject } from "inversify";
import { PaymentRequestLineController } from "./paymentRequestLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePaymentRequestLineSchema,
  UpdatePaymentRequestLineSchema,
  PaymentRequestLineQuerySchema,
  PaymentRequestLineParamsSchema,
} from "./paymentRequestLine.validator";
import { PAYMENT_REQUEST_LINE_TYPES } from "./paymentRequestLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PaymentRequestLineRouter {
  private router: Router;

  constructor(
    @inject(PAYMENT_REQUEST_LINE_TYPES.PaymentRequestLineController)
    private controller: PaymentRequestLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PaymentRequestLineQuerySchema, "query"),
      permissionMiddleware("paymentRequest", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreatePaymentRequestLineSchema, "body"),
      permissionMiddleware("paymentRequest", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(PaymentRequestLineParamsSchema, "params"),
      permissionMiddleware("paymentRequest", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(PaymentRequestLineParamsSchema, "params"),
      zodValidate(UpdatePaymentRequestLineSchema, "body"),
      permissionMiddleware("paymentRequest", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PaymentRequestLineParamsSchema, "params"),
      permissionMiddleware("paymentRequest", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
