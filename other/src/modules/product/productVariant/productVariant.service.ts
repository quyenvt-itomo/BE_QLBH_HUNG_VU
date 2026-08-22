import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ProductVariantRepository } from "./productVariant.repository";
import { PRODUCT_VARIANT_TYPES } from "./productVariant.types";
import { ProductVariant } from "@/database/models/ProductVariant";
import { Request } from "express";
import { EntityManager } from "typeorm";

/**
 * ProductVariant Service - Tenant Entity
 */
@injectable()
export class ProductVariantService extends BaseService<ProductVariant> {
  protected repository: ProductVariantRepository;
  protected uniqueFields: (keyof ProductVariant)[] = ["sku", "barcode"];
  protected uniqueScope?: (keyof ProductVariant)[] = ["productId"];

  constructor(
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRepository)
    repository: ProductVariantRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<ProductVariant>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { productId } = req?.params as { productId: string };
    data.productId = productId;
  }

  async updateAllVariantStockMetadata(): Promise<void> {
    const manager = this.repository.getRepository().manager;
    const allVariants = await this.repository.findAll(manager);
    const variantIds = allVariants.map((v) => v.id);
    for (const variantId of variantIds) {
      await this.repository.updateStockMetadata(variantId, manager);
    }
  }
}
