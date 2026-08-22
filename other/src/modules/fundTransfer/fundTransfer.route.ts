import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { FundTransferController } from "./fundTransfer.controller";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";
import {
  CreateFundTransferSchema,
  FundTransferParamsSchema,
  FundTransferQuerySchema,
  UpdateFundTransferSchema,
} from "./fundTransfer.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class FundTransferRouter {
  private router: Router;

  constructor(
    @inject(FUND_TRANSFER_TYPES.FundTransferController)
    private controller: FundTransferController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(FundTransferQuerySchema, "query"),
      permissionMiddleware("fundTransfer", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateFundTransferSchema, "body"),
      permissionMiddleware("fundTransfer", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(FundTransferParamsSchema, "params"),
      permissionMiddleware("fundTransfer", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(FundTransferParamsSchema, "params"),
      zodValidate(UpdateFundTransferSchema, "body"),
      permissionMiddleware("fundTransfer", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(FundTransferParamsSchema, "params"),
      permissionMiddleware("fundTransfer", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
