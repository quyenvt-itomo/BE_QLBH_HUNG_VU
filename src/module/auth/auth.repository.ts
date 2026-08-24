import { injectable } from "inversify";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { User } from "@/database/models/User";
import { AuthRelations, AuthRelationsList, AuthSelectFull, AuthSelectList } from "./auth.select";

@injectable()
export class AuthRepository extends BaseRepository<User> {
  protected entityClass = User;
  protected selectedFields = AuthSelectFull;
  protected selectedFieldsForList = AuthSelectList;
  protected relations = AuthRelations;
  protected relationsForList = AuthRelationsList;

  async findByUsername(username: string): Promise<User | null> {
    return await this.getRepository().findOne({
      where: { username },
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.getRepository().update(userId, {
      refreshToken: refreshToken || undefined,
    } as any);
  }
}
