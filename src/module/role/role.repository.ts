import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Role } from "@/database/models/company/Role";
import { RoleRelations, RoleSelectFull } from "./role.select";
import { SelectQueryBuilder } from "typeorm";

export class RoleRepository extends BaseRepository<Role> {
  protected entityClass = Role;
  protected selectedFields = RoleSelectFull;
  protected relations = RoleRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Role>,
    options: IFindPaginationOptions<Role>,
  ): Promise<void> {
    const alias = qb.alias;

    // Đếm số user cho mỗi role
    qb.loadRelationCountAndMap(`${alias}.userCount`, `${alias}.companyUsers`);
  }
}
