import { Router } from "express";
import { injectable, inject } from "inversify";
import { InvoiceController } from "./invoice.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceQuerySchema,
  InvoiceParamsSchema,
} from "./invoice.validator";
import { INVOICE_TYPES } from "./invoice.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class InvoiceRouter {
  private router: Router;

  constructor(
    @inject(INVOICE_TYPES.InvoiceController)
    private controller: InvoiceController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(InvoiceQuerySchema, "query"),
      permissionMiddleware("invoice", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateInvoiceSchema, "body"),
      permissionMiddleware("invoice", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(InvoiceParamsSchema, "params"),
      permissionMiddleware("invoice", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(InvoiceParamsSchema, "params"),
      zodValidate(UpdateInvoiceSchema, "body"),
      permissionMiddleware("invoice", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(InvoiceParamsSchema, "params"),
      permissionMiddleware("invoice", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
