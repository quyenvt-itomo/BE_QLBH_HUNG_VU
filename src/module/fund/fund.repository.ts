import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Fund, FundSnapshot } from "@/database/models/company/Fund";
import { FundSelectFull, FundRelations } from "./fund.select";
import { injectable } from "inversify";
import { EntityManager, SelectQueryBuilder } from "typeorm";
import { FundQueryDto } from "./fund.validator";

@injectable()
export class FundRepository extends BaseRepository<Fund> {
  protected entityClass = Fund;
  protected selectedFields = FundSelectFull;
  protected relations = FundRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Fund>,
    options: IFindPaginationOptions<Fund>,
  ): Promise<void> {
    const alias = qb.alias;
    const { type, isActive } = (options?.moreQuery as FundQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
    if (isActive !== undefined) {
      qb.andWhere(`${alias}.isActive = :isActive`, { isActive });
    }
  }

  async getSnapshot(
    id?: string | null,
    manager?: EntityManager,
  ): Promise<FundSnapshot | null> {
    if (!id) return null;
    const fund = await this.findById(id, manager);
    if (!fund) return null;
    return {
      id: fund.id,
      code: fund.code,
      name: fund.name,
      type: fund.type,
      storeId: fund.storeId,
      bankAccount: fund.bankAccount,
      isActive: fund.isActive,
    };
  }
}
