import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { IncomeExpense, Order, OrderLine, OrderType } from "@/database/models";
import { OrderQueryDto } from "./order.validator";
import {
  OrderRelations,
  OrderRelationsList,
  OrderSelectFull,
  OrderSelectList,
} from "./order.select";

@injectable()
export class OrderRepository extends BaseRepository<Order> {
  protected entityClass = Order;
  protected selectedFields = OrderSelectFull;
  protected selectedFieldsForList = OrderSelectList;
  protected relations = OrderRelations;
  protected relationsForList = OrderRelationsList;

  protected mapRawEntities(rawAndEntities: {
    entities: Order[];
    raw: any[];
  }): Order[] {
    const mapped = super.mapRawEntities(rawAndEntities) as Order[];
    return mapped.map((entity, index) => {
      const raw =
        rawAndEntities.raw.find((candidate) =>
          Object.entries(candidate || {}).some(
            ([key, value]) =>
              key.toLowerCase() === "entity_id" && String(value) === entity.id,
          ),
        ) ||
        rawAndEntities.raw[index] ||
        {};
      const getValue = (field: string) =>
        Object.entries(raw).find(
          ([key]) => key.toLowerCase() === `entity_${field}`.toLowerCase(),
        )?.[1];
      const paidAmount = getValue("paidAmount");
      const actualShippingFee = getValue("actualShippingFee");

      if (paidAmount !== undefined) entity.paidAmount = Number(paidAmount) || 0;
      if (actualShippingFee !== undefined) {
        entity.actualShippingFee = Number(actualShippingFee) || 0;
      }
      return entity;
    });
  }

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Order>,
    options: IFindPaginationOptions<Order>,
  ): Promise<void> {
    const alias = qb.alias;
    qb.addSelect(
      `(SELECT COALESCE(SUM("incomeExpense"."amount"), 0)
        FROM "income_expenses" "incomeExpense"
        WHERE "incomeExpense"."orderId" = "${alias}"."id"
          AND "incomeExpense"."deletedAt" IS NULL
          AND "incomeExpense"."status" <> 'canceled')`,
      "entity_paidAmount",
    );
    qb.addSelect(
      `(CASE WHEN "${alias}"."isFreeShipping" = true
        THEN 0 ELSE COALESCE("${alias}"."shippingFee", 0) END)`,
      "entity_actualShippingFee",
    );
    const {
      partnerIds,
      supplierIds,

      customerId,
      customerIds,

      shipperIds,

      productId,
      productIds,
      fundIds,
      statuses,
      completerIds,
    } = (options.moreQuery as OrderQueryDto) || {};
    const partnerId = (options.moreQuery as any)?.partnerId as
      | string
      | undefined;

    if (this.checkArrayFilter(statuses)) {
      qb.andWhere(`${alias}.status IN (:...statuses)`, { statuses });
    }
    if (this.checkArrayFilter(completerIds)) {
      qb.andWhere(`${alias}.completerId IN (:...completerIds)`, {
        completerIds,
      });
    }

    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, {
        partnerId,
      });
    } else if (this.checkArrayFilter(partnerIds)) {
      qb.andWhere(`${alias}.partnerId IN (:...partnerIds)`, {
        partnerIds,
      });
    }
    if (this.checkArrayFilter(supplierIds)) {
      qb.andWhere(`${alias}.partnerId IN (:...supplierIds)`, {
        supplierIds,
      });
    }

    if (customerId) {
      qb.andWhere(`${alias}.partnerId = :customerId`, {
        customerId,
      });
    } else if (this.checkArrayFilter(customerIds)) {
      qb.andWhere(`${alias}.partnerId IN (:...customerIds)`, {
        customerIds,
      });
    }

    // shipper filter
    if (this.checkArrayFilter(shipperIds)) {
      qb.andWhere(`${alias}.shipperId IN (:...shipperIds)`, {
        shipperIds,
      });
    }

    // product filter
    // trong order có lines, lines có productVariant, productVariant có productId
    if (productId || this.checkArrayFilter(productIds)) {
      const productIdsToFilter = productId ? [productId] : productIds;
      qb.andWhere((qb1) => {
        const subQuery = qb1
          .subQuery()
          .select("1")
          .from(OrderLine, "ol")
          .where(`ol.orderId = ${alias}.id`)
          .andWhere("ol.productId IN (:...productIds)")
          .andWhere("ol.deletedAt IS NULL")
          .getQuery();

        return `EXISTS ${subQuery}`;
      }).setParameter("productIds", productIdsToFilter);
    }

    // fund filter
    if (this.checkArrayFilter(fundIds)) {
      qb.andWhere((qb1) => {
        const subQuery = qb1
          .subQuery()
          .select("1")
          .from(IncomeExpense, "ie")
          .where(`ie.orderId = ${alias}.id`)
          .andWhere("ie.fundId IN (:...fundIds)")
          .andWhere("ie.deletedAt IS NULL")
          .getQuery();

        return `EXISTS ${subQuery}`;
      }).setParameter("fundIds", fundIds);
    }
  }
}
