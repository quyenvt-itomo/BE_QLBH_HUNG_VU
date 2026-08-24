import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { User } from "@/database/models/User";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { withTransaction } from "@/shared/base/TransactionManager";
import { UserRepository } from "./user.repository";
import { USER_TYPES } from "./user.types";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { StoreUser } from "@/database/models/store/StoreUser";
import { StoreUserRepository } from "@/module/storeUser/storeUser.repository";
import { STORE_USER_TYPES } from "@/module/storeUser/storeUser.types";

@injectable()
export class UserService extends BaseService<User> {
  protected repository: UserRepository;
  protected uniqueFields: (keyof User)[] = ["username"];
  constructor(
    @inject(USER_TYPES.Repository) repository: UserRepository,
    @inject(STORE_USER_TYPES.Repository)
    private storeUserRepository: StoreUserRepository,
  ) {
    super();
    this.repository = repository;
  }
  async validateBeforeCreate(
    data: DeepPartial<User>,
    _manager: EntityManager,
    _req?: RequestContext,
  ): Promise<void> {
    data.password = await AuthUtils.hashPassword(data.password || "123456");
  }

  async validateBeforeUpdate(
    _id: string,
    data: DeepPartial<User>,
    _manager: EntityManager,
    _req?: RequestContext,
  ): Promise<void> {
    if (!data.password) return;
    data.password = await AuthUtils.hashPassword(data.password);
  }

  private async syncStoreUsers(
    userId: string,
    storeUsers: DeepPartial<StoreUser>[],
    manager: EntityManager,
  ): Promise<void> {
    const repository = this.storeUserRepository.getRepository(manager);
    const existing = await repository.find({ where: { userId } as any });
    const storeIds = new Set<string>();

    for (const storeUser of storeUsers) {
      if (!storeUser.storeId) throw new Error("store.required");
      storeIds.add(storeUser.storeId);
    }

    const existingByStoreId = new Map(
      existing.map((storeUser) => [storeUser.storeId, storeUser]),
    );

    for (const storeId of storeIds) {
      if (existingByStoreId.has(storeId)) continue;
      await repository.save(repository.create({ userId, storeId }));
    }

    for (const storeUser of existing) {
      if (!storeIds.has(storeUser.storeId)) await repository.delete(storeUser.id);
    }
  }

  async update(
    id: string,
    data: DeepPartial<User>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<User | null> {
    const payload = { ...(data as any) } as DeepPartial<User> & {
      storeUsers?: DeepPartial<StoreUser>[];
      role?: unknown;
      notifications?: unknown;
    };
    const storeUsers = payload.storeUsers;

    // Relations are read-only in the user update payload. roleId is the
    // scalar column that BaseService should update; storeUsers are synced
    // separately through StoreUserRepository below.
    delete payload.storeUsers;
    delete payload.role;
    delete payload.notifications;

    // The FE sends a masked password when it is unchanged.
    if (typeof payload.password === "string" && /^\*+$/.test(payload.password)) {
      delete payload.password;
    }

    const run = async (em: EntityManager): Promise<User | null> => {
      const updated = await super.update(id, payload, em, req);
      if (!updated || !Array.isArray(storeUsers)) return updated;

      await this.syncStoreUsers(id, storeUsers, em);
      return this.repository.findById(id, em);
    };

    return manager ? run(manager) : withTransaction(run);
  }

  async actionAfterCreate(
    data: User,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}
}
