import { Router } from "express";
import { injectable, inject } from "inversify";
import { StockDocumentLineController } from "./stockDocumentLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateStockDocumentLineSchema,
  UpdateStockDocumentLineSchema,
  StockDocumentLineQuerySchema,
  StockDocumentLineParamsSchema,
} from "./stockDocumentLine.validator";
import { STOCK_DOCUMENT_LINE_TYPES } from "./stockDocumentLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class StockDocumentLineRouter {
  private router: Router;

  constructor(
    @inject(STOCK_DOCUMENT_LINE_TYPES.StockDocumentLineController)
    private controller: StockDocumentLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(StockDocumentLineQuerySchema, "query"),
      permissionMiddleware("stockDocument", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateStockDocumentLineSchema, "body"),
      permissionMiddleware("stockDocument", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(StockDocumentLineParamsSchema, "params"),
      permissionMiddleware("stockDocument", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(StockDocumentLineParamsSchema, "params"),
      zodValidate(UpdateStockDocumentLineSchema, "body"),
      permissionMiddleware("stockDocument", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(StockDocumentLineParamsSchema, "params"),
      permissionMiddleware("stockDocument", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
