import { injectable } from "inversify";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Shift } from "@/database/models/store/Shift";
import { ShiftRelations, ShiftSelectFull } from "./shift.select";
import { ShiftStatusEnum } from "@/shared/constants/enum";
import { SelectQueryBuilder } from "typeorm";
import { ShiftQueryDto } from "./shift.validator";

@injectable()
export class ShiftRepository extends BaseRepository<Shift> {
  protected entityClass = Shift;
  protected selectedFields = ShiftSelectFull;
  protected relations = ShiftRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Shift>,
    options: IFindPaginationOptions<Shift>,
  ): Promise<void> {
    const alias = qb.alias;

    const { storeId, userIds } = (options?.moreQuery as ShiftQueryDto) || {};

    if (storeId) {
      qb.andWhere(`${alias}.storeId = :storeId`, { storeId });
    }

    if (this.checkArrayFilter(userIds)) {
      qb.andWhere(`${alias}.createdBy IN (:...userIds)`, { userIds });
    }
  }

  async getUserCurrentShift(
    userId: string,
    storeId?: string,
  ): Promise<Shift | null> {
    const qb = await this.createQueryBuilder("shift");

    qb.where("shift.status = :status", {
      status: ShiftStatusEnum.ACTIVE,
    }).andWhere("shift.createdBy = :userId", { userId });

    if (storeId) {
      qb.andWhere("shift.storeId = :storeId", { storeId });
    }

    qb.orderBy("shift.createdAt", "DESC").limit(1);

    const shift = await qb.getOne();
    return shift || null;
  }
}
