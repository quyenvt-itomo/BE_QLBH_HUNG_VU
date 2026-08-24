import { injectable } from "inversify";
import { Role } from "@/database/models/Role";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { RoleRelations, RoleRelationsList, RoleSelectFull, RoleSelectList } from "./role.select";
@injectable()
export class RoleRepository extends BaseRepository<Role> {
  protected entityClass = Role;
  protected selectedFields = RoleSelectFull;
  protected selectedFieldsForList = RoleSelectList;
  protected relations = RoleRelations;
  protected relationsForList = RoleRelationsList;
}
