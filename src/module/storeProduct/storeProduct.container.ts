import { ContainerModule } from "inversify";
import { StoreProductRepository } from "./storeProduct.repository";
import { StoreProductService } from "./storeProduct.service";
import { StoreProductController } from "./storeProduct.controller";
import { StoreProductRouter } from "./storeProduct.route";
import { STORE_PRODUCT_TYPES } from "./storeProduct.types";

export const storeProductModule = new ContainerModule((bind) => { bind(STORE_PRODUCT_TYPES.Repository).to(StoreProductRepository).inSingletonScope(); bind(STORE_PRODUCT_TYPES.Service).to(StoreProductService).inSingletonScope(); bind(STORE_PRODUCT_TYPES.Controller).to(StoreProductController).inSingletonScope(); bind(STORE_PRODUCT_TYPES.Router).to(StoreProductRouter).inSingletonScope(); });
