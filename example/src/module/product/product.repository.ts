import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Product, ProductSnapshot } from "@/database/models/company/Product";
import { ProductSelectFull, ProductRelations } from "./product.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { ProductQueryDto } from "./product.validator";

@injectable()
export class ProductRepository extends BaseRepository<Product> {
  protected entityClass = Product;
  protected selectedFields = ProductSelectFull;
  protected relations = ProductRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Product>,
    options: IFindPaginationOptions<Product>,
  ): Promise<void> {
    const alias = qb.alias;
    const { type, types, groupId, isPublic } =
      (options?.moreQuery as ProductQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    } else if (this.checkArrayFilter(types)) {
      qb.andWhere(`${alias}.type IN (:...types)`, { types });
    }
    if (groupId) {
      qb.andWhere(`${alias}.groupId = :groupId`, { groupId });
    }
    if (typeof isPublic === "boolean") {
      qb.andWhere(`${alias}.isPublic = :isPublic`, { isPublic });
    }
  }

  /**
   * Gán hệ số quy đổi
   * @param data
   * @param manager
   */
  async attachUnitConversion<
    T extends {
      productId?: string | null;
      unitId?: string | null;
      conversionRateAtTime?: number | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (data.productId && data.unitId) {
      const product = await this.findByOption(
        {
          where: { id: data.productId },
          relations: { extraUnits: true },
        },
        manager,
      );

      if (product) {
        if (product.baseUnitId === data.unitId) {
          data.conversionRateAtTime = 1;
        } else {
          const extraUnit = product.extraUnits.find(
            (eu) => eu.unitId === data.unitId,
          );
          if (extraUnit) {
            data.conversionRateAtTime = extraUnit.conversionRate;
          }
        }
      }
    } else {
      data.conversionRateAtTime = 1;
    }
  }

  /**
   * Gán productId → productSnapshot cho line hoặc entity chính.
   * Dùng trong validateBeforeCreate để populate snapshot.
   */
  async attachInfo<
    T extends {
      productId?: string | null;
      productSnapshot?: DeepPartial<ProductSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (
      data.productId &&
      (!data.productSnapshot ||
        (data.productSnapshot as any).id !== data.productId)
    ) {
      data.productSnapshot = await this.getSnapshot(data.productId, manager);
    }
  }

  async getSnapshot(
    productId: string,
    manager?: EntityManager,
  ): Promise<ProductSnapshot | null> {
    const product = await this.findById(productId, manager);
    if (!product) return null;
    return { id: product.id, code: product.code, name: product.name };
  }
}
