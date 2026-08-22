import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { RoleRepository } from "./role.repository";
import { Role } from "@/database/models/store/Role";
import { ROLE_TYPES } from "./role.types";
import { Request } from "express";
import { EntityManager } from "typeorm";
import { USER_TYPES } from "../user/user.types";
import { UserRepository } from "../user/user.repository";
import { SocketUtils } from "@/shared/utils/socket.utils";

@injectable()
export class RoleService extends BaseService<Role> {
  protected repository: RoleRepository;
  protected uniqueFields: (keyof Role)[] = ["name"];
  protected uniqueScope: (keyof Role)[] = ["storeId"];
  protected searchableFields = ["name"];

  constructor(
    @inject(ROLE_TYPES.RoleRepository)
    roleRepository: RoleRepository,
    @inject(USER_TYPES.UserRepository)
    private userRepository: UserRepository,
  ) {
    super();
    this.repository = roleRepository;
  }

  async actionAfterUpdate(
    data: Role,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const users = await this.userRepository.findByOptions(
      {
        where: {
          storeUsers: {
            roleId: data.id,
          },
        },
      },
      manager,
    );
    if (!users.length) return;
    SocketUtils.sendSocketRole(users.map((u) => u.id));
  }
}
