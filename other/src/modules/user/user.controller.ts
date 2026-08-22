import { injectable, inject } from "inversify";
import { UserService } from "./user.service";
import { BaseController } from "@/shared/base/BaseController";
import { USER_TYPES } from "./user.types";
import { User } from "@/database/models/User";

@injectable()
export class UserController extends BaseController<User> {
  protected service: UserService;
  constructor(@inject(USER_TYPES.UserService) service: UserService) {
    super();
    this.service = service;
  }
}
