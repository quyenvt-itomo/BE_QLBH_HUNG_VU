import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Order } from "@/database/models/store/Order";
import { OrderSelectFull, OrderRelations } from "./order.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { OrderLine } from "@/database/models/store/OrderLine";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { OrderStatusEnum, OrderTypeEnum } from "@/shared/constants/enum";

/**
 * Order Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class OrderRepository extends BaseRepository<Order> {
  protected entityClass = Order;
  protected selectedFields = OrderSelectFull;
  protected relations = OrderRelations;
  protected nestedFileFields = ["lines.productVariant"]; // Load files cho productVariant trong orderLines

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Order>,
    options: IFindPaginationOptions<Order>,
  ): Promise<void> {
    super.extendQueryBuilder?.(qb, options);

    const {
      storeId,
      employeeIds,
      partnerIds,
      supplierIds,
      customerIds,
      shipperIds,
      productIds,
      fundIds,
    } = options?.moreQuery || {};

    if (storeId) {
      qb.andWhere(`${qb.alias}.storeId = :storeId`, {
        storeId: storeId,
      });
    }

    // employee filter
    if (this.checkArrayFilter(employeeIds)) {
      qb.andWhere(`${qb.alias}.employeeId IN (:...employeeIds)`, {
        employeeIds,
      });
    }

    // partner filter
    if (this.checkArrayFilter(partnerIds)) {
      qb.andWhere(`${qb.alias}.partnerId IN (:...partnerIds)`, {
        partnerIds,
      });
    }
    if (this.checkArrayFilter(supplierIds)) {
      qb.andWhere(`${qb.alias}.partnerId IN (:...supplierIds)`, {
        supplierIds,
      });
    }
    if (this.checkArrayFilter(customerIds)) {
      qb.andWhere(`${qb.alias}.partnerId IN (:...customerIds)`, {
        customerIds,
      });
    }

    // shipper filter
    if (this.checkArrayFilter(shipperIds)) {
      qb.andWhere(`${qb.alias}.shippingProviderId IN (:...shipperIds)`, {
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
          .innerJoin("ol.productVariant", "pv")
          .where(`ol.orderId = ${qb.alias}.id`)
          .andWhere("pv.productId IN (:...productIds)")
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
          .where(`ie.orderId = ${qb.alias}.id`)
          .andWhere("ie.fundId IN (:...fundIds)")
          .andWhere("ie.deletedAt IS NULL")
          .getQuery();

        return `EXISTS ${subQuery}`;
      }).setParameter("fundIds", fundIds);
    }
  }

  async aggregateShiftSummary(
    storeId: string,
    startAt: Date,
    endAt?: Date | null,
    req?: any,
  ) {
    const qb = await this.createQueryBuilder("o");

    qb.select([
      // đếm số lượng đơn hàng theo type
      `COUNT(*) FILTER (WHERE o.type = :sale) as total_sale_order`,
      `COUNT(*) FILTER (WHERE o.type = :saleReturn) as total_sale_return_order`,

      // tổng doanh thu của đơn bán và đơn khác hoàn
      `SUM(o.totalAmount) FILTER (
        WHERE o.type = :sale OR o.type = :saleReturn
      ) as total_revenue`,

      // tổng giá trị giảm từ điểm mà khách sử dụng SUM (loyaltyPointsDiscountAmount)
      `SUM(o.loyaltyPointsDiscountAmount) FILTER (
        WHERE o.type = :sale OR o.type = :saleReturn
      ) as total_loyalty_discount`,
    ])
      .where("o.storeId = :storeId")
      .andWhere("o.status = :posted")
      .andWhere("o.orderAt >= :startAt");

    // Only filter by endAt if shift is closed
    if (endAt) {
      qb.andWhere("o.orderAt <= :endAt");
    }

    const params: any = {
      storeId,
      posted: OrderStatusEnum.POSTED,
      sale: OrderTypeEnum.SALE,
      saleReturn: OrderTypeEnum.SALE_RETURN,
      startAt,
    };

    if (endAt) {
      params.endAt = endAt;
    }

    const result = await qb.setParameters(params).getRawOne();

    return {
      totalSaleOrder: parseInt(result.total_sale_order) || 0,
      totalSaleReturnOrder: parseInt(result.total_sale_return_order) || 0,
      totalRevenue: parseFloat(result.total_revenue) || 0,
      totalLoyaltyDiscount: parseFloat(result.total_loyalty_discount) || 0,
    };
  }
}
