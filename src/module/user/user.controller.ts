import { inject, injectable } from "inversify";
import { User } from "@/database/models/User";
import { BaseController } from "@/shared/base/BaseController";
import { UserService } from "./user.service";
import { USER_TYPES } from "./user.types";
@injectable()
export class UserController extends BaseController<User> { protected service: UserService; constructor(@inject(USER_TYPES.Service) service: UserService) { super(); this.service = service; } }
