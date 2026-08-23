import { StoreUserController } from "./storeUser.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class StoreUserRouter { constructor(private readonly controller: StoreUserController) {} getRouter() { return simpleRoutes(this.controller, "store"); } }
