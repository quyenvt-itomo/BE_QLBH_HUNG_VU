import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { StoreProduct } from "@/database/models/store/StoreProduct";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { StoreProductRepository } from "./storeProduct.repository";
import { STORE_PRODUCT_TYPES } from "./storeProduct.types";
@injectable()
export class StoreProductService extends BaseService<StoreProduct> { protected repository: StoreProductRepository; protected uniqueFields: (keyof StoreProduct)[] = ["productId"]; protected uniqueScope: (keyof StoreProduct)[] = ["storeId"]; constructor(@inject(STORE_PRODUCT_TYPES.Repository) repository: StoreProductRepository) { super(); this.repository = repository; } async validateBeforeCreate(data: DeepPartial<StoreProduct>, _manager: EntityManager, req?: RequestContext): Promise<void> { data.storeId = data.storeId || req?.storeContext?.storeId; if (!data.storeId) throw new Error("store.required"); } }
