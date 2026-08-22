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
    super.extendQueryBuilder?.(qb, options);

    // Không lấy user admin
    qb.andWhere(`${qb.alias}.username NOT ILIKE :adminUsername`, {
      adminUsername: "%admin%",
    });

    // Nếu xem trong cửa hàng thì chỉ lấy người dùng có storeUsers trong cửa hàng đó
    if (options?.moreQuery?.storeId) {
      qb.innerJoin(`${qb.alias}.storeUsers`, "su", "su.storeId = :storeId", {
        storeId: options.moreQuery.storeId,
      });
    }
  }

  async getSnapshot(
    id: string,
    manager?: EntityManager,
  ): Promise<UserSnapshot | null> {
    const user = await this.findById(id, manager);
    if (!user) {
      return null;
    }

    return getUserSnapshot(user);
  }
}
