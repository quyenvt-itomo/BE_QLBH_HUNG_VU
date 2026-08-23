import { User } from "@/database/models/User";
import { SimpleRepository } from "../_shared/simple.repository";
export class UserRepository extends SimpleRepository<User> { constructor() { super(User, undefined, { role: true, storeUsers: { store: true } }); } }
