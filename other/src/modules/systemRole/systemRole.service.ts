import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { SystemRoleRepository } from "./systemRole.repository";
import { SystemRole } from "@/database/models/SystemRole";
import { SYSTEM_ROLE_TYPES } from "./systemRole.types";

@injectable()
export class SystemRoleService extends BaseService<SystemRole> {
  protected repository: SystemRoleRepository;
  protected uniqueFields: (keyof SystemRole)[] = ["name"];
  protected searchableFields = ["name"];

  constructor(
    @inject(SYSTEM_ROLE_TYPES.SystemRoleRepository)
    repository: SystemRoleRepository,
  ) {
    super();
    this.repository = repository;
  }
}
