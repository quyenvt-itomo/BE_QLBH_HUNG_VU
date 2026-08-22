import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { User } from "@/database/models/User";
import { UserSelectFull, UserRelations } from "./user.select";
import { EntityManager, SelectQueryBuilder } from "typeorm";
import { UserSnapshot } from "@/shared/base/BaseEntity";
import { getUserSnapshot } from "@/shared/utils/utils";

export class UserRepository extends BaseRepository<User> {
  protected entityClass = User;
  protected selectedFields = UserSelectFull;
  protected relations = UserRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<User>,
    options: IFindPaginationOptions<User>,
  ): Promise<void> {
    const alias = qb.alias;
    const { companyId } = options;

    qb.andWhere(
      `(${alias}.username NOT ILIKE :admin OR ${alias}.username IS NULL)`,
      { admin: "%admin%" },
    );

    if (companyId) {
      // chỉ lấy những người dùng được phân quyền trong công ty này (join vowis relationship companyUsers, phỉa tồn tại 1 bản ghi có companyId này)
      qb.innerJoin(`${alias}.companyUsers`, "cu", "cu.companyId = :companyId", {
        companyId,
      });
    }
  }

  async getSnapshot(
    id?: string | null,
    manager?: EntityManager,
  ): Promise<UserSnapshot | null> {
    if (!id) return null;
    const user = await super.findById(id, manager);
    if (!user) return null;
    return getUserSnapshot(user);
  }
}
