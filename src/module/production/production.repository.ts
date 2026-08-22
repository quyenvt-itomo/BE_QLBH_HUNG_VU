import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import {
  Production,
  ProductionSnapshot,
} from "@/database/models/company/Production";
import { ProductionSelectFull, ProductionRelations } from "./production.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { ProductionQueryDto } from "./production.validator";

@injectable()
export class ProductionRepository extends BaseRepository<Production> {
  protected entityClass = Production;
  protected selectedFields = ProductionSelectFull;
  protected relations = ProductionRelations;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Production>,
    options: IFindPaginationOptions<Production>,
  ): Promise<void> {
    const alias = qb.alias;
    const { type, status, orderId, staffId, factoryId } =
      (options?.moreQuery as ProductionQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
    if (status) {
      qb.andWhere(`${alias}.status = :status`, { status });
    }
    if (orderId) {
      qb.andWhere(`${alias}.orderId = :orderId`, { orderId });
    }
    if (staffId) {
      qb.andWhere(`${alias}.staffId = :staffId`, { staffId });
    }
    if (factoryId) {
      qb.andWhere(`${alias}.factoryId = :factoryId`, { factoryId });
    }
  }

  async attachInfo<
    T extends {
      productionId?: string | null;
      productionSnapshot?: DeepPartial<ProductionSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (
      data.productionId &&
      (!data.productionSnapshot ||
        data.productionSnapshot.id !== data.productionId)
    )
      data.productionSnapshot = await this.getSnapshot(
        data.productionId,
        manager,
      );
  }

  async getSnapshot(
    productionId: string,
    manager?: EntityManager,
  ): Promise<ProductionSnapshot | null> {
    const p = await this.findById(productionId, manager);
    if (!p) return null;
    return {
      id: p.id,
      type: p.type,
      timeAt: p.timeAt,
      code: p.code,
      name: p.name,
      sequenceNumber: p.sequenceNumber,
      orderId: p.orderId,
      orderSnapshot: p.orderSnapshot,
      meshSpecId: p.meshSpecId,
      meshSpecSnapshot: p.meshSpecSnapshot,
      staffId: p.staffId,
      staffSnapshot: p.staffSnapshot,
      factoryId: p.factoryId,
      factorySnapshot: p.factorySnapshot,
    };
  }
}
