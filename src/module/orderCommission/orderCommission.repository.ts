import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { OrderCommission } from "@/database/models/store/OrderCommission";
import {
  OrderCommissionSelectFull,
  OrderCommissionRelations,
} from "./orderCommission.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { OrderCommissionQueryDto } from "./orderCommission.validator";

@injectable()
export class OrderCommissionRepository extends BaseRepository<OrderCommission> {
  protected entityClass = OrderCommission;
  protected selectedFields = OrderCommissionSelectFull;
  protected relations = OrderCommissionRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<OrderCommission>,
    options: IFindPaginationOptions<OrderCommission>,
  ): Promise<void> {
    const alias = qb.alias;
    const { orderId, partnerContactId } =
      (options?.moreQuery as OrderCommissionQueryDto) || {};

    if (orderId) {
      qb.andWhere(`${alias}.orderId = :orderId`, { orderId });
    }
    if (partnerContactId) {
      qb.andWhere(`${alias}.partnerContactId = :partnerContactId`, {
        partnerContactId,
      });
    }
  }
}
