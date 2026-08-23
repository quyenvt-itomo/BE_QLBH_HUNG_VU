import { Role } from "@/database/models/Role";
import { SimpleRepository } from "../_shared/simple.repository";
export class RoleRepository extends SimpleRepository<Role> { constructor() { super(Role, undefined, { users: true }); } }
