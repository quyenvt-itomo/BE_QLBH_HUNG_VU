import { RoleController } from "./role.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class RoleRouter { constructor(private readonly controller: RoleController) {} getRouter() { return simpleRoutes(this.controller, "role"); } }
