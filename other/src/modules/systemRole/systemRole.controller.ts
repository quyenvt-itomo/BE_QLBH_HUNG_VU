import { injectable, inject } from "inversify";
import { SystemRoleService } from "./systemRole.service";
import { BaseController } from "@/shared/base/BaseController";
import { SYSTEM_ROLE_TYPES } from "./systemRole.types";
import { SystemRole } from "@/database/models/SystemRole";

@injectable()
export class SystemRoleController extends BaseController<SystemRole> {
  protected service: SystemRoleService;

  constructor(
    @inject(SYSTEM_ROLE_TYPES.SystemRoleService)
    service: SystemRoleService,
  ) {
    super();
    this.service = service;
  }
}
