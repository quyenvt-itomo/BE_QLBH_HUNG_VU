import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { StoreSelectFull, StoreRelations } from "./store.select";
import { Store } from "@/database/models/Store";
import { SelectQueryBuilder } from "typeorm";
import { RoleType } from "@/database/models";

export class StoreRepository extends BaseRepository<Store> {
  protected entityClass = Store;
  protected selectedFields = StoreSelectFull;
  protected relations = StoreRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Store>,
    options: IFindPaginationOptions<Store>,
  ): Promise<void> {
    const alias = qb.alias;

    // userCount = storeUsers.length + user.role = "system"
    qb.loadRelationCountAndMap(
      `${alias}.userCount`,
      `${alias}.storeUsers`,
      "storeUser",
      (qb) =>
        qb
          .innerJoin("storeUser.user", "user")
          .innerJoin("user.role", "role")
          .andWhere("role.type = :roleType", {
            roleType: RoleType.SYSTEM,
          }),
    );
  }
}
