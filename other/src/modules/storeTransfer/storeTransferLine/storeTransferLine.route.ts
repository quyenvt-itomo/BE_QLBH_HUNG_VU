import { Router } from "express";
import { injectable, inject } from "inversify";
import { StoreTransferLineController } from "./storeTransferLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateStoreTransferLineSchema,
  UpdateStoreTransferLineSchema,
  StoreTransferLineParamsSchema,
  StoreTransferLineCreateParamsSchema,
} from "./storeTransferLine.validator";
import { STORE_TRANSFER_LINE_TYPES } from "./storeTransferLine.types";

@injectable()
export class StoreTransferLineRouter {
  private router: Router;

  constructor(
    @inject(STORE_TRANSFER_LINE_TYPES.StoreTransferLineController)
    private transferLineController: StoreTransferLineController,
  ) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // POST /line - Create new line
    this.router.post(
      "/",
      zodValidate(StoreTransferLineCreateParamsSchema, "params"),
      zodValidate(CreateStoreTransferLineSchema, "body"),
      this.transferLineController.create,
    );

    // PUT /line/:id - Update line
    this.router.put(
      "/:id",
      zodValidate(StoreTransferLineParamsSchema, "params"),
      zodValidate(UpdateStoreTransferLineSchema, "body"),
      this.transferLineController.update,
    );

    // DELETE /line/:id - Delete line
    this.router.delete(
      "/:id",
      zodValidate(StoreTransferLineParamsSchema, "params"),
      this.transferLineController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
