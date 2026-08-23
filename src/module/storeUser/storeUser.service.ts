import { StoreUser } from "@/database/models/store/StoreUser";
import { SimpleService } from "../_shared/simple.service";
import { StoreUserRepository } from "./storeUser.repository";
export class StoreUserService extends SimpleService<StoreUser> { constructor(repository: StoreUserRepository) { super(repository, "store"); } }
