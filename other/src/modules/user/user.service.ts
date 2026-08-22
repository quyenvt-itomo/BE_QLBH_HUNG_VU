import { injectable, inject } from "inversify";
import { Request } from "express";
import { BaseService } from "@/shared/base/BaseService";
import { UserRepository } from "./user.repository";
import { User } from "@/database/models/User";
import { DeepPartial, EntityManager, In } from "typeorm";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { USER_TYPES } from "./user.types";
import { ROLE_TYPES, RoleRepository } from "../role";
import { BadRequestError, IError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";
import { UpdateUserDto } from "./user.validator";
import { STORE_USER_TYPES, StoreUserRepository } from "../storeUser";
import { StoreUser } from "@/database/models/store/StoreUser";

@injectable()
export class UserService extends BaseService<User> {
  protected repository: UserRepository;
  protected uniqueFields: (keyof User)[] = ["username", "email", "phone"];
  protected searchableFields = [
    "name",
    "username",
    "code",
    "email",
    "phone",
    "systemRole.name",
    "note",
  ];

  constructor(
    @inject(USER_TYPES.UserRepository)
    repository: UserRepository,
    @inject(ROLE_TYPES.RoleRepository)
    private roleRepository: RoleRepository,
    @inject(STORE_USER_TYPES.StoreUserRepository)
    private storeUserRepository: StoreUserRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateStoreUsers(
    storeUsers: DeepPartial<StoreUser>[],
    manager: EntityManager,
  ): Promise<IError[]> {
    const errors: IError[] = [];

    // Bổ sung storeId tương ứng với roleId
    for (let i = 0; i < storeUsers.length; i++) {
      const su = storeUsers[i];
      const role = await this.roleRepository.findById(su.roleId!, manager);
      if (!role) {
        errors.push({
          field: `storeUsers.${i}.roleId`,
          code: ErrorsMessages.not_found,
        });
        continue;
      }
      su.storeId = role.storeId;
    }

    // Check duplicate storeId
    errors.push(
      ...this.checkDuplicate(storeUsers, ["storeId", "roleId"], "storeUsers"),
    );

    return errors;
  }

  async validateBeforeCreate(
    data: DeepPartial<User>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const errors: IError[] = [];
    if (data.password) {
      const passwordHash = await AuthUtils.hashPassword(data.password);
      data.password = passwordHash;
    }

    if (data.storeUsers) {
      errors.push(
        ...(await this.validateStoreUsers(data.storeUsers, manager!)),
      );
    }

    if (errors.length > 0) {
      throw new BadRequestError("Validation errors", errors);
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<User>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { storeUsers } = data as UpdateUserDto;
    delete data.storeUsers;

    if (storeUsers) {
      await this.updateStoreUsers(id, storeUsers, manager);
    }
  }

  async updateStoreUsers(
    userId: string,
    storeUsers: { id?: string; roleId: string }[],
    manager: EntityManager,
  ): Promise<void> {
    // 1. Lấy toàn bộ storeUser hiện tại trong DB
    const existingStoreUsers = await this.storeUserRepository.findByOptions(
      {
        where: { userId },
      },
      manager,
    );

    const existingMap = new Map(existingStoreUsers.map((su) => [su.id, su]));

    // 2. Phân loại input
    const toCreate: Partial<StoreUser>[] = [];
    const toUpdate: Partial<StoreUser>[] = [];
    const incomingIds = new Set<string>();

    for (const su of storeUsers) {
      // Case update (id hợp lệ & tồn tại trong DB)
      if (su.id && existingMap.has(su.id)) {
        incomingIds.add(su.id);

        const existing = existingMap.get(su.id)!;

        // Chỉ update khi có thay đổi roleId
        if (existing.roleId !== su.roleId) {
          toUpdate.push({
            id: su.id,
            roleId: su.roleId,
          });
        }
      } else {
        toCreate.push({
          userId,
          roleId: su.roleId,
        });
      }
    }

    // 3. Xác định các bản ghi cần xoá (DB có nhưng client không gửi lên)
    const toDeleteIds = existingStoreUsers
      .filter((su) => !incomingIds.has(su.id))
      .map((su) => su.id);

    // 4. Validate (roleId → storeId, duplicate storeId/roleId)
    const errors: IError[] = await this.validateStoreUsers(
      [...toCreate, ...toUpdate],
      manager,
    );

    if (errors.length > 0) {
      throw new BadRequestError("Validation errors", errors);
    }

    // 5. Thực hiện xoá
    if (toDeleteIds.length > 0) {
      await this.storeUserRepository.softDeleteMany(
        { id: In(toDeleteIds) },
        manager,
      );
    }

    // 6. Thực hiện update
    for (const su of toUpdate) {
      await this.storeUserRepository.update(su.id!, su, manager);
    }

    // 7. Thực hiện create
    if (toCreate.length > 0) {
      await this.storeUserRepository.createMany(toCreate, manager);
    }
  }
}
