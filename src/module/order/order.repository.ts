import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { IncomeExpense, Order, OrderLine, OrderType } from "@/database/models";
import { OrderQueryDto } from "./order.validator";

@injectable()
export class OrderRepository extends BaseRepository<Order> {
  protected entityClass = Order;
  protected relations = {
    partner: true,
    shipper: true,
    lines: { product: true, unit: true },
    refOrder: true,
  } as any;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Order>,
    options: IFindPaginationOptions<Order>,
  ): Promise<void> {
    const alias = qb.alias;
    const {
      partnerIds,
      supplierIds,
      customerIds,
      shipperIds,
      productIds,
      fundIds,
    } = (options.moreQuery as OrderQueryDto) || {};
    const partnerId = (options.moreQuery as any)?.partnerId as string | undefined;

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
    if (this.checkArrayFilter(customerIds)) {
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
    if (this.checkArrayFilter(productIds)) {
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
      }).setParameter("productIds", productIds);
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
