import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { Role } from "@/database/models/company/Role";
import { RoleService } from "./role.service";
import { ROLE_TYPES } from "./role.types";

@injectable()
export class RoleController extends BaseController<Role> {
  protected service: RoleService;
  constructor(@inject(ROLE_TYPES.RoleService) service: RoleService) {
    super();
    this.service = service;
  }
}
