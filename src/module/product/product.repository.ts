import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { BaseRepository } from "@/shared/base/BaseRepository";
import {
  AttributeType,
  Product,
  ProductSnapshot,
  StoreProduct,
} from "@/database/models";
import { IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { AttributeRepository } from "../attribute/attribute.repository";
import { ATTRIBUTE_TYPES } from "../attribute/attribute.types";
import { ProductRelations, ProductSelectFull } from "./product.select";
import { ProductQueryDto } from "./product.validator";

@injectable()
export class ProductRepository extends BaseRepository<Product> {
  protected entityClass = Product;
  protected selectedFields = ProductSelectFull;
  protected relations = ProductRelations;

  constructor(
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
  ) {
    super();
  }

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Product>,
    options: IFindPaginationOptions<Product>,
  ): Promise<void> {
    const query = (options.moreQuery || {}) as ProductQueryDto;
    const productCategoryIds = query.productCategoryIds;

    if (this.checkArrayFilter(productCategoryIds)) {
      const categoryIds = await this.attributeRepository.getDescendantIds(
        productCategoryIds!,
        AttributeType.PRODUCT_GROUP,
      );

      if (!categoryIds.length) {
        qb.andWhere("1 = 0");
      } else {
        qb.andWhere(`${qb.alias}.groupId IN (:...productCategoryIds)`, {
          productCategoryIds: categoryIds,
        });
      }
    } else if (query.groupId) {
      qb.andWhere(`${qb.alias}.groupId = :groupId`, {
        groupId: query.groupId,
      });
    }
  }

  /**
   * Tính tồn cho một variant của product
   * @param variantId
   * @param storeId
   * @returns
   */
  async calculateStock(
    data: Product | string,
    storeId?: string,
  ): Promise<{
    stockQuantity: number;
    stockValue: number;
  }> {
    const product = typeof data === "string" ? await this.getById(data) : data;
    return storeId
      ? {
          stockQuantity:
            Number(product?.stockMetadata?.byStore?.[storeId]?.quantity) || 0,
          stockValue:
            Number(product?.stockMetadata?.byStore?.[storeId]?.value) || 0,
        }
      : {
          stockQuantity: Number(product?.stockMetadata?.total?.quantity) || 0,
          stockValue: Number(product?.stockMetadata?.total?.value) || 0,
        };
  }

  async attachInfo<
    T extends {
      productId?: string | null;
      productSnapshot?: DeepPartial<ProductSnapshot> | null;
    },
  >(
    data: T,
    manager?: EntityManager,
    rawProduct?: Product | null,
  ): Promise<void> {
    if (
      data.productId &&
      (!data.productSnapshot || data.productSnapshot.id !== data.productId)
    )
      data.productSnapshot = await this.getSnapshot(
        rawProduct || data.productId,
        manager,
      );
  }

  async attachUnitConversion<
    T extends {
      productId?: string | null;
      unitId?: string | null;
      conversionRateAtTime?: number | null;
    },
  >(
    data: T,
    manager?: EntityManager,
    rawProduct?: Product | null,
  ): Promise<void> {
    if (!data.productId || !data.unitId) {
      data.conversionRateAtTime = 1;
      return;
    }
    const product = rawProduct
      ? rawProduct
      : await this.getRepository(manager).findOne({
          where: { id: data.productId },
          relations: { extraUnits: true },
        });

    const unit = product?.extraUnits?.find(
      (item) => item.unitId === data.unitId,
    );
    data.conversionRateAtTime =
      product?.baseUnitId === data.unitId
        ? 1
        : Number(unit?.conversionRate) || 1;
  }

  async getUnitCost(
    productId: string,
    unitId: string,
    storeId?: string,
    manager?: EntityManager,
    rawProduct?: Product | null,
  ): Promise<number> {
    if (storeId) {
      const storeProduct = await this.getRepository(manager)
        .manager.getRepository(StoreProduct)
        .findOne({ where: { productId, storeId } });
      if (storeProduct) return Number(storeProduct.costPrice) || 0;
    }
    const product = rawProduct
      ? rawProduct
      : await this.getRepository(manager).findOne({
          where: { id: productId },
          relations: { extraUnits: true },
        });
    if (!product) return 0;
    const extra = product.extraUnits?.find((item) => item.unitId === unitId);
    return product.baseUnitId === unitId ? 0 : Number(extra?.salePrice) || 0;
  }

  async attachCostInfo<
    T extends {
      productId?: string | null;
      unitId?: string | null;
      storeId?: string | null;
      quantity?: number | null;
      costPriceAtTime?: number | null;
      totalCost?: number | null;
    },
  >(
    data: T,
    manager?: EntityManager,
    rawProduct?: Product | null,
  ): Promise<void> {
    if (!data.productId || !data.unitId) return;
    await this.attachUnitConversion(data, manager, rawProduct);
    data.costPriceAtTime = await this.getUnitCost(
      data.productId,
      data.unitId,
      data.storeId || undefined,
      manager,
      rawProduct,
    );
    data.totalCost =
      (Number(data.quantity) || 0) * (Number(data.costPriceAtTime) || 0);
  }

  async getSnapshot(
    data: Product | string,
    manager?: EntityManager,
  ): Promise<ProductSnapshot | null> {
    const isString = typeof data === "string";
    const product = isString
      ? await this.getRepository(manager).findOne({
          where: { id: data } as any,
        })
      : data;

    return product
      ? { id: product.id, code: product.code, name: product.name }
      : null;
  }
}
