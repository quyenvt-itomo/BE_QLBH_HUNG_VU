import { zodValidate } from "@/shared/middleware/validation.middleware";
import { Router } from "express";
import { inject, injectable } from "inversify";
import { AttributeController } from "./attribute.controller";
import { ATTRIBUTE_TYPES } from "./attribute.types";
import {
  AttributeParamsSchema,
  AttributeQuerySchema,
  CreateAttributeSchema,
  UpdateAttributeSchema,
} from "./attribute.validator";

@injectable()
export class AttributeRouter {
  private router: Router;

  constructor(
    @inject(ATTRIBUTE_TYPES.AttributeController)
    private attributeController: AttributeController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(AttributeQuerySchema, "query"),
      this.attributeController.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateAttributeSchema, "body"),
      this.attributeController.create,
    );

    this.router.get(
      "/:id",
      zodValidate(AttributeParamsSchema, "params"),
      this.attributeController.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(AttributeParamsSchema, "params"),
      zodValidate(UpdateAttributeSchema, "body"),
      this.attributeController.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(AttributeParamsSchema, "params"),
      this.attributeController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
