import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { OrderLine } from "@/database/models/company/OrderLine";
import { OrderLineSelectFull, OrderLineRelations } from "./orderLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { OrderLineQueryDto } from "./orderLine.validator";

@injectable()
export class OrderLineRepository extends BaseRepository<OrderLine> {
  protected entityClass = OrderLine;
  protected selectedFields = OrderLineSelectFull;
  protected relations = OrderLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<OrderLine>,
    options: IFindPaginationOptions<OrderLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { orderId, productId, type } =
      (options?.moreQuery as OrderLineQueryDto) || {};

    if (orderId) {
      qb.andWhere(`${alias}.orderId = :orderId`, { orderId });
    }
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
  }
}
