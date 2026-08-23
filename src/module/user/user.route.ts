import { UserController } from "./user.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class UserRouter { constructor(private readonly controller: UserController) {} getRouter() { return simpleRoutes(this.controller, "user"); } }
