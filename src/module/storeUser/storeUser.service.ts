import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { StoreUser } from "@/database/models/store/StoreUser";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { StoreUserRepository } from "./storeUser.repository";
import { STORE_USER_TYPES } from "./storeUser.types";
@injectable()
export class StoreUserService extends BaseService<StoreUser> { protected repository: StoreUserRepository; protected uniqueFields: (keyof StoreUser)[] = ["userId"]; protected uniqueScope: (keyof StoreUser)[] = ["storeId"]; constructor(@inject(STORE_USER_TYPES.Repository) repository: StoreUserRepository) { super(); this.repository = repository; } async validateBeforeCreate(data: DeepPartial<StoreUser>, _manager: EntityManager, req?: RequestContext): Promise<void> { data.storeId = data.storeId || req?.storeContext?.storeId; if (!data.storeId) throw new Error("store.required"); } }
