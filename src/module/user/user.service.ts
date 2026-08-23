import { User } from "@/database/models/User";
import { SimpleService } from "../_shared/simple.service";
import { UserRepository } from "./user.repository";
export class UserService extends SimpleService<User> { constructor(repository: UserRepository) { super(repository, "global", "user"); } }
