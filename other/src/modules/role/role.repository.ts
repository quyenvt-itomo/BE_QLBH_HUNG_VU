import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { RoleSelectFull, RoleRelations } from "./role.select";
import { Role } from "@/database/models/store/Role";
import { SelectQueryBuilder } from "typeorm";

export class RoleRepository extends BaseRepository<Role> {
  protected entityClass = Role;
  protected selectedFields = RoleSelectFull;
  protected relations = RoleRelations;

  constructor() {
    super();
  }

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Role>,
    options: IFindPaginationOptions<Role>,
  ): Promise<void> {
    super.extendQueryBuilder?.(qb, options);
    if (options?.moreQuery?.storeId) {
      qb.andWhere(`${qb.alias}.storeId = :storeId`, {
        storeId: options.moreQuery.storeId,
      });
    }
  }
}
