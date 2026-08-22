import { Router } from "express";
import { injectable, inject } from "inversify";
import { StoreTransferController } from "./storeTransfer.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateStoreTransferSchema,
  UpdateStoreTransferSchema,
  StoreTransferQuerySchema,
  StoreTransferParamsSchema,
} from "./storeTransfer.validator";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import {
  STORE_TRANSFER_LINE_TYPES,
  StoreTransferLineRouter,
} from "./storeTransferLine";

@injectable()
export class StoreTransferRouter {
  private router: Router;

  constructor(
    @inject(STORE_TRANSFER_TYPES.StoreTransferController)
    private controller: StoreTransferController,
    @inject(STORE_TRANSFER_LINE_TYPES.StoreTransferLineRouter)
    private transferLineRouter: StoreTransferLineRouter,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Nested line routes
    this.router.use(
      "/:transferId/line",
      permissionMiddleware("storeTransfer", "update"),
      this.controller.checkExits("transferId"),
      this.transferLineRouter.getRouter(),
    );

    // GET / - Get all transfers with filters
    this.router.get(
      "/",
      zodValidate(StoreTransferQuerySchema, "query"),
      permissionMiddleware("storeTransfer", "read"),
      this.controller.getAllWithPagination,
    );

    // POST / - Create new transfer
    this.router.post(
      "/",
      zodValidate(CreateStoreTransferSchema, "body"),
      permissionMiddleware("storeTransfer", "create"),
      this.controller.create,
    );

    // GET /:id - Get transfer by ID
    this.router.get(
      "/:id",
      zodValidate(StoreTransferParamsSchema, "params"),
      permissionMiddleware("storeTransfer", "read"),
      this.controller.getById,
    );

    // PUT /:id - Update transfer
    this.router.put(
      "/:id",
      zodValidate(StoreTransferParamsSchema, "params"),
      zodValidate(UpdateStoreTransferSchema, "body"),
      permissionMiddleware("storeTransfer", "update"),
      this.controller.update,
    );

    // DELETE /:id - Delete transfer
    this.router.delete(
      "/:id",
      zodValidate(StoreTransferParamsSchema, "params"),
      permissionMiddleware("storeTransfer", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
