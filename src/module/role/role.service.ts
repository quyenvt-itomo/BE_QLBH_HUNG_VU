import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { Role } from "@/database/models/Role";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { RoleRepository } from "./role.repository";
import { ROLE_TYPES } from "./role.types";
@injectable()
export class RoleService extends BaseService<Role> { protected repository: RoleRepository; protected uniqueFields: (keyof Role)[] = ["name"]; constructor(@inject(ROLE_TYPES.Repository) repository: RoleRepository) { super(); this.repository = repository; } async validateBeforeCreate(_data: DeepPartial<Role>, _manager: EntityManager, _req?: RequestContext): Promise<void> {} }
