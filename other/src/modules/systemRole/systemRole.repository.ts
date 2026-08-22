import { BaseRepository } from "@/shared/base/BaseRepository";
import { SystemRoleSelectFull, SystemRoleRelations } from "./systemRole.select";
import { SystemRole } from "@/database/models/SystemRole";

export class SystemRoleRepository extends BaseRepository<SystemRole> {
  protected entityClass = SystemRole;
  protected selectedFields = SystemRoleSelectFull;
  protected relations = SystemRoleRelations;

  constructor() {
    super();
  }
}
