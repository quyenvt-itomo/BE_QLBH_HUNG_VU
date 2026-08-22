import { Router } from "express";
import { injectable, inject } from "inversify";
import { PaymentTermController } from "./paymentTerm.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePaymentTermSchema,
  UpdatePaymentTermSchema,
  PaymentTermQuerySchema,
  PaymentTermParamsSchema,
} from "./paymentTerm.validator";
import { PAYMENT_TERM_TYPES } from "./paymentTerm.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PaymentTermRouter {
  private router: Router;

  constructor(
    @inject(PAYMENT_TERM_TYPES.PaymentTermController)
    private controller: PaymentTermController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PaymentTermQuerySchema, "query"),
      permissionMiddleware("paymentTerm", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      zodValidate(CreatePaymentTermSchema, "body"),
      permissionMiddleware("paymentTerm", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(PaymentTermParamsSchema, "params"),
      permissionMiddleware("paymentTerm", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(PaymentTermParamsSchema, "params"),
      zodValidate(UpdatePaymentTermSchema, "body"),
      permissionMiddleware("paymentTerm", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(PaymentTermParamsSchema, "params"),
      permissionMiddleware("paymentTerm", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
