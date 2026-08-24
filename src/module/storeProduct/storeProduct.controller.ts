import { inject, injectable } from "inversify";
import { StoreProduct } from "@/database/models/store/StoreProduct";
import { BaseController } from "@/shared/base/BaseController";
import { StoreProductService } from "./storeProduct.service";
import { STORE_PRODUCT_TYPES } from "./storeProduct.types";
@injectable()
export class StoreProductController extends BaseController<StoreProduct> { protected service: StoreProductService; constructor(@inject(STORE_PRODUCT_TYPES.Service) service: StoreProductService) { super(); this.service = service; } }
