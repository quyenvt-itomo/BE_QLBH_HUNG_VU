import { injectable, inject } from "inversify";
import { BaseService, IFindOptions } from "@/shared/base/BaseService";
import { Role } from "@/database/models/company/Role";
import { RoleRepository } from "./role.repository";
import { ROLE_TYPES } from "./role.types";
import { RequestContext } from "@/shared/types/interfaces";
import { PermissionStructure } from "@/shared/middleware/permission.middleware";
import { EntityManager } from "typeorm";
import { USER_TYPES } from "../user/user.types";
import { UserRepository } from "../user/user.repository";
import { SocketUtils } from "@/shared/utils/socket.utils";
import { ForbiddenError } from "@/shared/types/errors";

@injectable()
export class RoleService extends BaseService<Role> {
  protected repository: RoleRepository;
  protected uniqueFields: (keyof Role)[] = ["name"];
  protected uniqueScope?: (keyof Role)[] | undefined = ["companyId"];
  protected searchableFields = ["name"];

  constructor(
    @inject(ROLE_TYPES.RoleRepository)
    repository: RoleRepository,
    @inject(USER_TYPES.UserRepository)
    private userRepository: UserRepository,
  ) {
    super();
    this.repository = repository;
  }

  protected async attachMoreDataToEntities(
    entities: Role[],
    req?: RequestContext,
  ): Promise<void> {
    for (const item of entities) {
      const permissionCount = this.countPermissions(item.permissions);
      (item as any).permissionCount = permissionCount;
    }
  }

  countPermissions(permissions: PermissionStructure): number {
    if (!permissions) return 0;

    return Object.values(permissions).reduce((total, actions) => {
      return total + (actions?.length || 0);
    }, 0);
  }

  async actionAfterUpdate(
    data: Role,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const users = await this.userRepository.findByOptions(
      { where: { companyUsers: { roleId: data.id } } },
      manager,
    );

    if (!users.length) return;
    SocketUtils.sendSocketRole(users.map((u) => u.id));
  }

  async update(
    id: string,
    data: Partial<Role>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<Role | null> {
    const existing = await this.repository.findById(id);
    if (existing && !existing.companyId) {
      throw new ForbiddenError("Không thể sửa vai trò mặc định của hệ thống");
    }
    return super.update(id, data, manager, req);
  }

  async delete(
    id: string,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (existing && !existing.companyId) {
      throw new ForbiddenError("Không thể xóa vai trò mặc định của hệ thống");
    }
    return super.delete(id, manager, req);
  }
}
