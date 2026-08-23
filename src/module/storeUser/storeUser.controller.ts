import { StoreUser } from "@/database/models/store/StoreUser";
import { SimpleController } from "../_shared/simple.controller";
import { StoreUserService } from "./storeUser.service";
export class StoreUserController extends SimpleController<StoreUser> { constructor(service: StoreUserService) { super(service); } }
