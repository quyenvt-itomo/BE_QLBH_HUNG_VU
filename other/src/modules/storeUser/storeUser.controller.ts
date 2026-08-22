import { injectable, inject } from "inversify";
import { StoreUserService } from "./storeUser.service";
import { BaseController } from "@/shared/base/BaseController";
import { STORE_USER_TYPES } from "./storeUser.types";
import { StoreUser } from "@/database/models/store/StoreUser";

@injectable()
export class StoreUserController extends BaseController<StoreUser> {
  protected service: StoreUserService;

  constructor(
    @inject(STORE_USER_TYPES.StoreUserService) service: StoreUserService,
  ) {
    super();
    this.service = service;
  }
}
