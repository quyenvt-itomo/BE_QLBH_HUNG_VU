import { StoreUser } from "@/database/models/store/StoreUser";
import { SimpleRepository } from "../_shared/simple.repository";
export class StoreUserRepository extends SimpleRepository<StoreUser> { constructor() { super(StoreUser, undefined, { store: true, user: true }); } }
