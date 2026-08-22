import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { StoreUserRepository } from "./storeUser.repository";
import { STORE_USER_TYPES } from "./storeUser.types";
import { StoreUser } from "@/database/models/store/StoreUser";

/**
 * StoreUser Service -  Entity
 */
@injectable()
export class StoreUserService extends BaseService<StoreUser> {
  protected repository: StoreUserRepository;
  protected uniqueFields: (keyof StoreUser)[] = ["userId"];
  protected uniqueScope: (keyof StoreUser)[] = ["storeId"];

  constructor(
    @inject(STORE_USER_TYPES.StoreUserRepository)
    repository: StoreUserRepository,
  ) {
    super();
    this.repository = repository;
  }
}
