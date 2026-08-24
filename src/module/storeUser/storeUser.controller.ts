import { inject, injectable } from "inversify";
import { StoreUser } from "@/database/models/store/StoreUser";
import { BaseController } from "@/shared/base/BaseController";
import { StoreUserService } from "./storeUser.service";
import { STORE_USER_TYPES } from "./storeUser.types";
@injectable()
export class StoreUserController extends BaseController<StoreUser> { protected service: StoreUserService; constructor(@inject(STORE_USER_TYPES.Service) service: StoreUserService) { super(); this.service = service; } }
