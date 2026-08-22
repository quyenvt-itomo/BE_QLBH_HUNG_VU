import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Product, ProductSnapshot } from "@/database/models/company/Product";
import {
  ProductSelectFull,
  ProductSelectList,
  ProductRelations,
  ProductRelationsList,
} from "./product.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { ProductQueryDto } from "./product.validator";

@injectable()
export class ProductRepository extends BaseRepository<Product> {
  protected entityClass = Product;
  protected selectedFields = ProductSelectFull;
  protected selectedFieldsForList = ProductSelectList;
  protected relations = ProductRelations;
  protected relationsForList = ProductRelationsList;

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

  /** Giá vốn hiện hành theo đúng ĐVT của line. */
  async getUnitCost(
    productId: string,
    unitId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const product = await this.getRepository(manager).findOne({
      where: { id: productId } as any,
      relations: { extraUnits: true },
    });
    if (!product) return 0;
    if (product.baseUnitId === unitId) return Number(product.price) || 0;
    return Number(
      product.extraUnits?.find((unit) => unit.unitId === unitId)?.pricePerUnit,
    ) || 0;
  }

  /** Snapshot hệ số và giá vốn, không cho client tự truyền lại giá trị này. */
  async attachCostInfo<
    T extends {
      productId?: string | null;
      unitId?: string | null;
      conversionRateAtTime?: number | null;
      costPriceAtTime?: number | null;
      costAmount?: number | null;
      quantity?: number | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (!data.productId || !data.unitId) return;
    await this.attachUnitConversion(data, manager);
    data.costPriceAtTime = await this.getUnitCost(
      data.productId,
      data.unitId,
      manager,
    );
    data.costAmount = (Number(data.quantity) || 0) * (data.costPriceAtTime || 0);
  }
}
