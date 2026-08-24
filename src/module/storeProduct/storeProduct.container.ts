import { createSimpleModule } from "../_shared/simple.bind";
import { StoreProductRepository } from "./storeProduct.repository";
import { StoreProductService } from "./storeProduct.service";
import { StoreProductController } from "./storeProduct.controller";
import { StoreProductRouter } from "./storeProduct.route";
import { STORE_PRODUCT_TYPES } from "./storeProduct.types";

export const storeProductModule = createSimpleModule(
  STORE_PRODUCT_TYPES,
  StoreProductRepository,
  StoreProductService,
  StoreProductController,
  StoreProductRouter,
);
