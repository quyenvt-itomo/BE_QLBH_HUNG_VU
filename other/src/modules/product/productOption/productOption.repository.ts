import { BaseRepository } from "@/shared/base/BaseRepository";
import { ProductOption } from "@/database/models/ProductOption";
import {
  ProductOptionSelectFull,
  ProductOptionRelations,
} from "./productOption.select";
import { injectable } from "inversify";
import { EntityManager, In } from "typeorm";

/**
 * ProductOption Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class ProductOptionRepository extends BaseRepository<ProductOption> {
  protected entityClass = ProductOption;
  protected selectedFields = ProductOptionSelectFull;
  protected relations = ProductOptionRelations;

  // Xóa relationship với product variants trước khi xóa option
  async deleteRelationshipWithVariants(
    optionIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    if (optionIds.length === 0) return;

    await manager
      .createQueryBuilder()
      .delete()
      .from("product_variants_options_product_options")
      .where('"productOptionsId" IN (:...optionIds)', { optionIds })
      .execute();
  }

  async deleteByTypeId(
    productId: string,
    typeId: string,
    manager?: EntityManager,
  ): Promise<void> {
    if (manager) {
      await this.softDeleteMany({ productId, typeId }, manager);
      return;
    }

    await this.softDeleteMany({ productId, typeId });
  }

  async deleteByProductId(
    productId: string,
    manager?: EntityManager,
  ): Promise<void> {
    if (manager) {
      await this.softDeleteMany({ productId }, manager);
      return;
    }
    await this.softDeleteMany({ productId });
  }
}
