import { injectable, inject } from "inversify";
import { ProductVariantService } from "./productVariant.service";
import { PRODUCT_VARIANT_TYPES } from "./productVariant.types";
import { BaseController } from "@/shared/base/BaseController";
import { ProductVariant } from "@/database/models/ProductVariant";

/**
 * ProductVariant Controller - Tenant Entity
 */
@injectable()
export class ProductVariantController extends BaseController<ProductVariant> {
  protected service: ProductVariantService;

  constructor(
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantService)
    service: ProductVariantService,
  ) {
    super();
    this.service = service;
  }
}
