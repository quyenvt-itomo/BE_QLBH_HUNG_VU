import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateStoreUserSchema,
  UpdateStoreUserSchema,
  StoreUserQuerySchema,
  StoreUserParamsSchema,
} from "./storeUser.validator";
import { StoreUserController } from "./storeUser.controller";
import { STORE_USER_TYPES } from "./storeUser.types";

@injectable()
export class StoreUserRouter {
  private router: Router;

  constructor(
    @inject(STORE_USER_TYPES.StoreUserController)
    private controller: StoreUserController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All store routes require authentication
    // this.router.use(authenticate);

    // GET /stores - Get all stores with filters
    this.router.get(
      "/",
      zodValidate(StoreUserQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );

    // POST /stores - Create new store
    this.router.post(
      "/",
      zodValidate(CreateStoreUserSchema, "body"),
      this.controller.create,
    );

    // GET /stores/:id - Get store by ID
    this.router.get(
      "/:id",
      zodValidate(StoreUserParamsSchema, "params"),
      this.controller.getById,
    );

    // PUT /stores/:id - Update store
    this.router.put(
      "/:id",
      zodValidate(StoreUserParamsSchema, "params"),
      zodValidate(UpdateStoreUserSchema, "body"),
      this.controller.update,
    );

    // DELETE /stores/:id - Delete store
    this.router.delete(
      "/:id",
      zodValidate(StoreUserParamsSchema, "params"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
