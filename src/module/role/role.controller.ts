import { Role } from "@/database/models/Role";
import { SimpleController } from "../_shared/simple.controller";
import { RoleService } from "./role.service";
export class RoleController extends SimpleController<Role> { constructor(service: RoleService) { super(service); } }
