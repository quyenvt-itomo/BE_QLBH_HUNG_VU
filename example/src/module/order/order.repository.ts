import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Order, OrderSnapshot } from "@/database/models/company/Order";
import {
  OrderSelectFull,
  OrderSelectList,
  OrderRelations,
  OrderRelationsList,
  OrderRelationSelects,
  OrderRelationSelectsForList,
} from "./order.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { OrderQueryDto } from "./order.validator";

@injectable()
export class OrderRepository extends BaseRepository<Order> {
  protected entityClass = Order;
  protected selectedFields = OrderSelectFull;
  protected selectedFieldsForList = OrderSelectList;
  protected relations = OrderRelations;
  protected relationsForList = OrderRelationsList;
  protected relationSelects = OrderRelationSelects;
  protected relationSelectsForList = OrderRelationSelectsForList;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Order>,
    options: IFindPaginationOptions<Order>,
  ): Promise<void> {
    const alias = qb.alias;
    const { customerId, staffId, isCompleted, quotationId } =
      (options?.moreQuery as OrderQueryDto) || {};

    if (customerId) {
      qb.andWhere(`${alias}.customerId = :customerId`, { customerId });
    }
    if (staffId) {
      qb.andWhere(`${alias}.staffId = :staffId`, { staffId });
    }
    if (typeof isCompleted === "boolean") {
      qb.andWhere(`${alias}.isCompleted = :isCompleted`, { isCompleted });
    }
    if (quotationId) {
      qb.andWhere(`${alias}.quotationId = :quotationId`, {
        quotationId,
      });
    }
  }

  async attachInfo<
    T extends {
      orderId?: string | null;
      orderSnapshot?: DeepPartial<OrderSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (
      data.orderId &&
      (!data.orderSnapshot || data.orderSnapshot.id !== data.orderId)
    )
      data.orderSnapshot = await this.getSnapshot(data.orderId, manager);
  }

  async getSnapshot(
    id?: string | null,
    manager?: EntityManager,
  ): Promise<OrderSnapshot | null> {
    if (!id) return null;
    const order = await this.findById(id, manager);
    if (!order) return null;
    return {
      id: order.id,
      code: order.code,
      timeAt: order.timeAt,
      customerId: order.customerId,
      customerSnapshot: order.customerSnapshot,
      staffId: order.staffId,
      staffSnapshot: order.staffSnapshot,
    };
  }
}
