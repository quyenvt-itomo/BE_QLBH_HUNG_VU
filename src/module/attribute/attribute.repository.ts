import {
  DeepPartial,
  EntityManager,
  IsNull,
  SelectQueryBuilder,
} from "typeorm";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import {
  Attribute,
  AttributeSnapshot,
  AttributeType,
  isStoreScopedAttributeType,
} from "@/database/models/Attribute";
import { AttributeRelations, AttributeRelationsList, AttributeSelectFull, AttributeSelectList } from "./attribute.select";
import { AttributeQueryDto } from "./attribute.validator";

export class AttributeRepository extends BaseRepository<Attribute> {
  protected entityClass = Attribute;
  protected selectedFields = AttributeSelectFull;
  protected selectedFieldsForList = AttributeSelectList;
  protected relations = AttributeRelations;
  protected relationsForList = AttributeRelationsList;
  protected enableFileAttachment: boolean = false;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Attribute>,
    options: IFindPaginationOptions<Attribute>,
  ): Promise<void> {
    const alias = qb.alias;
    const { type, showStatistics } =
      (options.moreQuery as AttributeQueryDto) || {};
    const storeId = options.storeId;
    if (type) {
      qb.andWhere(`${alias}.type = :attributeType`, {
        attributeType: type,
      });
    }

    if (isStoreScopedAttributeType(type)) {
      if (!storeId) qb.andWhere("1 = 0");
      else
        qb.andWhere(`${alias}.storeId = :attributeStoreId`, {
          attributeStoreId: storeId,
        });
    } else if (type) {
      qb.andWhere(`${alias}.storeId IS NULL`);
    } else if (storeId) {
      qb.andWhere(
        `(${alias}.storeId = :attributeStoreId OR ${alias}.storeId IS NULL)`,
        {
          attributeStoreId: storeId,
        },
      );
    }
    if (showStatistics) this.addStatisticsSelects(qb, type, storeId);
  }

  private addStatisticsSelects(
    qb: SelectQueryBuilder<Attribute>,
    type?: AttributeType,
    storeId?: string,
  ): void {
    if (!type) return;

    const attributeId = `${qb.alias}."id"`;
    const attributeName = `${qb.alias}."name"`;

    if (
      [
        AttributeType.PRODUCT_GROUP,
        AttributeType.BRAND,
        AttributeType.UNIT,
        AttributeType.LOCATION,
      ].includes(type)
    ) {
      let productCountQuery: string;

      if (type === AttributeType.PRODUCT_GROUP) {
        productCountQuery = `
          SELECT COUNT(DISTINCT product."id")
          FROM "products" product
          WHERE product."groupId" = ${attributeId}
            AND product."deletedAt" IS NULL
        `;
      } else if (type === AttributeType.BRAND) {
        productCountQuery = `
          SELECT COUNT(DISTINCT product."id")
          FROM "products" product
          WHERE product."brandId" = ${attributeId}
            AND product."deletedAt" IS NULL
        `;
      } else if (type === AttributeType.UNIT) {
        productCountQuery = `
          SELECT COUNT(DISTINCT product."id")
          FROM "products" product
          LEFT JOIN "product_extra_units" extraUnit
            ON extraUnit."productId" = product."id"
           AND extraUnit."deletedAt" IS NULL
          WHERE product."deletedAt" IS NULL
            AND (
              product."baseUnitId" = ${attributeId}
              OR extraUnit."unitId" = ${attributeId}
            )
        `;
      } else {
        productCountQuery = storeId
          ? `
            SELECT COUNT(DISTINCT storeProduct."productId")
            FROM "store_products" storeProduct
            WHERE storeProduct."location" = ${attributeName}
              AND storeProduct."deletedAt" IS NULL
              AND storeProduct."storeId" = :attributeStatsStoreId
          `
          : "SELECT 0";
      }

      qb.addSelect(
        `COALESCE((${productCountQuery}), 0)`,
        "entity_productCount",
      );
      if (type === AttributeType.LOCATION && storeId) {
        qb.setParameter("attributeStatsStoreId", storeId);
      }
    }

    if (
      [
        AttributeType.CUSTOMER_GROUP,
        AttributeType.SUPPLIER_GROUP,
        AttributeType.SHIPPER_GROUP,
      ].includes(type)
    ) {
      const partnerType =
        type === AttributeType.CUSTOMER_GROUP
          ? "customer"
          : type === AttributeType.SUPPLIER_GROUP
            ? "supplier"
            : "shipper";

      qb.addSelect(
        `COALESCE((
          SELECT COUNT(DISTINCT partner."id")
          FROM "partners" partner
          WHERE partner."groupId" = ${attributeId}
            AND partner."type" = :attributePartnerType
            AND partner."deletedAt" IS NULL
        ), 0)`,
        "entity_partnerCount",
      );
      qb.setParameter("attributePartnerType", partnerType);
    }

    if (
      type === AttributeType.INCOME_CATEGORY ||
      type === AttributeType.EXPENSE_CATEGORY
    ) {
      const storeCondition = storeId
        ? 'AND incomeExpense."storeId" = :attributeStatsStoreId'
        : "";

      qb.addSelect(
        `COALESCE((
          SELECT COUNT(DISTINCT incomeExpense."id")
          FROM "income_expenses" incomeExpense
          WHERE incomeExpense."categoryId" = ${attributeId}
            AND incomeExpense."type" = :attributeIncomeExpenseType
            AND incomeExpense."deletedAt" IS NULL
            ${storeCondition}
        ), 0)`,
        "entity_incomeExpenseCount",
      );
      qb.addSelect(
        `COALESCE((
          SELECT SUM(incomeExpense."amount")
          FROM "income_expenses" incomeExpense
          WHERE incomeExpense."categoryId" = ${attributeId}
            AND incomeExpense."type" = :attributeIncomeExpenseType
            AND incomeExpense."deletedAt" IS NULL
            ${storeCondition}
        ), 0)`,
        "entity_incomeExpenseAmount",
      );
      qb.setParameter(
        "attributeIncomeExpenseType",
        type === AttributeType.INCOME_CATEGORY ? "INCOME" : "EXPENSE",
      );
      if (storeId) qb.setParameter("attributeStatsStoreId", storeId);
    }
  }

  protected mapRawEntities(rawAndEntities: {
    entities: Attribute[];
    raw: any[];
  }): Attribute[] {
    const entities = super.mapRawEntities(rawAndEntities) as Attribute[];
    const fields = [
      "productCount",
      "partnerCount",
      "incomeExpenseCount",
      "incomeExpenseAmount",
    ] as const;

    return entities.map((entity, index) => {
      const raw = rawAndEntities.raw[index] || {};
      for (const field of fields) {
        const rawKey = Object.keys(raw).find(
          (key) => key.toLowerCase() === `entity_${field}`.toLowerCase(),
        );
        const value = rawKey ? raw[rawKey] : undefined;
        if (value !== undefined) entity[field] = Number(value) || 0;
      }
      return entity;
    });
  }

  async getHierarchyRows(
    type: AttributeType,
    manager?: EntityManager,
  ): Promise<Pick<Attribute, "id" | "parentId" | "type">[]> {
    return await this.getRepository(manager).find({
      select: { id: true, parentId: true, type: true },
      where: { type, deletedAt: IsNull() } as any,
    });
  }

  async getDescendantIds(
    ids: string[],
    type: AttributeType,
    manager?: EntityManager,
  ): Promise<string[]> {
    const roots = Array.from(new Set(ids.filter(Boolean)));
    if (!roots.length) return [];

    const rows = await this.getHierarchyRows(type, manager);
    const childrenByParent = new Map<string, string[]>();

    for (const row of rows) {
      if (!row.parentId) continue;
      const children = childrenByParent.get(row.parentId) || [];
      children.push(row.id);
      childrenByParent.set(row.parentId, children);
    }

    const result = new Set(roots);
    const queue = [...roots];
    while (queue.length) {
      const parentId = queue.shift()!;
      for (const childId of childrenByParent.get(parentId) || []) {
        if (result.has(childId)) continue;
        result.add(childId);
        queue.push(childId);
      }
    }

    return Array.from(result);
  }

  async getAttributeByName(
    name: string,
    type: AttributeType,
    manager?: EntityManager,
    storeId?: string | null,
  ): Promise<Attribute | null> {
    if (isStoreScopedAttributeType(type) && !storeId) return null;

    return await this.findOne(
      {
        where: {
          name,
          type,
          storeId: isStoreScopedAttributeType(type) ? storeId : null,
        } as any,
      },
      manager,
    );
  }

  async getSnapshot(
    id?: string | null,
    manager?: EntityManager,
  ): Promise<AttributeSnapshot | null> {
    if (!id) return null;
    const attribute = await this.findById(id, manager);
    if (!attribute) return null;

    return {
      id: attribute.id,
      name: attribute.name,
    };
  }

  /**
   * Gán unitId → unitSnapshot cho line hoặc entity chính.
   * Dùng trong validateBeforeCreate để populate snapshot.
   */
  async attachUnitInfo<
    T extends {
      unitId?: string | null;
      unitSnapshot?: DeepPartial<AttributeSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (
      data.unitId &&
      (!data.unitSnapshot || (data.unitSnapshot as any).id !== data.unitId)
    ) {
      data.unitSnapshot = await this.getSnapshot(data.unitId, manager);
    }
  }

  async attachInfo<T extends {
    categoryId?: string | null;
    categorySnapshot?: DeepPartial<AttributeSnapshot> | null;
  }>(data: T, manager?: EntityManager): Promise<void> {
    if (data.categoryId && (!data.categorySnapshot || data.categorySnapshot.id !== data.categoryId)) {
      data.categorySnapshot = await this.getSnapshot(data.categoryId, manager);
    }
  }
}
