import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import {
  ShippingPlan,
  ShippingPlanSnapshot,
} from "@/database/models/company/ShippingPlan";
import {
  ShippingPlanSelectFull,
  ShippingPlanRelations,
} from "./shippingPlan.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { ShippingPlanQueryDto } from "./shippingPlan.validator";

@injectable()
export class ShippingPlanRepository extends BaseRepository<ShippingPlan> {
  protected entityClass = ShippingPlan;
  protected selectedFields = ShippingPlanSelectFull;
  protected relations = ShippingPlanRelations;
  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<ShippingPlan>,
    options: IFindPaginationOptions<ShippingPlan>,
  ): Promise<void> {
    const alias = qb.alias;
    const { orderId, purchaseId, partnerId, approveStatus } =
      (options?.moreQuery as ShippingPlanQueryDto) || {};

    if (orderId) {
      qb.andWhere(`${alias}.orderId = :orderId`, { orderId });
    }
    if (purchaseId) {
      qb.andWhere(`${alias}.purchaseId = :purchaseId`, { purchaseId });
    }
    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, { partnerId });
    }
    if (approveStatus) {
      qb.andWhere(`${alias}.approveStatus = :approveStatus`, { approveStatus });
    }
  }

  async attachInfo<
    T extends {
      shippingPlanId?: string | null;
      shippingPlanSnapshot?: DeepPartial<ShippingPlanSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (
      data.shippingPlanId &&
      (!data.shippingPlanSnapshot ||
        data.shippingPlanSnapshot.id !== data.shippingPlanId)
    )
      data.shippingPlanSnapshot = await this.getSnapshot(
        data.shippingPlanId,
        manager,
      );
  }

  async getSnapshot(
    shippingPlanId: string,
    manager?: EntityManager,
  ): Promise<ShippingPlanSnapshot | null> {
    const sp = await this.findById(shippingPlanId, manager);
    if (!sp) return null;
    return {
      id: sp.id,
      code: sp.code,
      partnerId: sp.partnerId,
      partnerSnapshot: sp.partnerSnapshot,
      unitPrice: sp.unitPrice,
    };
  }
}
