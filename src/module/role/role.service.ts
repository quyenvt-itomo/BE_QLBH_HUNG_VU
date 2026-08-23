import { Role } from "@/database/models/Role";
import { SimpleService } from "../_shared/simple.service";
import { RoleRepository } from "./role.repository";
export class RoleService extends SimpleService<Role> { constructor(repository: RoleRepository) { super(repository, "global", "role"); } }
