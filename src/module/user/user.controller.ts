import { User } from "@/database/models/User";
import { SimpleController } from "../_shared/simple.controller";
import { UserService } from "./user.service";
export class UserController extends SimpleController<User> { constructor(service: UserService) { super(service); } }
