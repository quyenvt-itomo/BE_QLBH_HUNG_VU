import { Router } from "express";
import { injectable, inject } from "inversify";
import { StockDocumentController } from "./stockDocument.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateStockDocumentSchema,
  UpdateStockDocumentSchema,
  StockDocumentQuerySchema,
  StockDocumentParamsSchema,
  ConfirmExportSchema,
  ConfirmImportSchema,
  ConfirmBillingSchema,
} from "./stockDocument.validator";
import { STOCK_DOCUMENT_TYPES } from "./stockDocument.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class StockDocumentRouter {
  private router: Router;

  constructor(
    @inject(STOCK_DOCUMENT_TYPES.StockDocumentController)
    private controller: StockDocumentController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(StockDocumentQuerySchema, "query"),
      permissionMiddleware("stockDocument", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateStockDocumentSchema, "body"),
      permissionMiddleware("stockDocument", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(StockDocumentParamsSchema, "params"),
      permissionMiddleware("stockDocument", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(StockDocumentParamsSchema, "params"),
      zodValidate(UpdateStockDocumentSchema, "body"),
      permissionMiddleware("stockDocument", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(StockDocumentParamsSchema, "params"),
      permissionMiddleware("stockDocument", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/confirm-export",
      zodValidate(StockDocumentParamsSchema, "params"),
      zodValidate(ConfirmExportSchema, "body"),
      permissionMiddleware("stockDocument", "confirmExport"),
      this.controller.confirmExport,
    );

    this.router.post(
      "/:id/confirm-import",
      zodValidate(StockDocumentParamsSchema, "params"),
      zodValidate(ConfirmImportSchema, "body"),
      permissionMiddleware("stockDocument", "confirmImport"),
      this.controller.confirmImport,
    );

    this.router.post(
      "/:id/complete",
      zodValidate(StockDocumentParamsSchema, "params"),
      zodValidate(ConfirmBillingSchema, "body"),
      permissionMiddleware("stockDocument", "complete"),
      this.controller.complete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
