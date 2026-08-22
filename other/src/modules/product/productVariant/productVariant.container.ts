import { ContainerModule } from "inversify";
import { ProductVariantController } from "./productVariant.controller";
import { ProductVariantService } from "./productVariant.service";
import { ProductVariantRepository } from "./productVariant.repository";
import { ProductVariantRouter } from "./productVariant.route";
import { PRODUCT_VARIANT_TYPES } from "./productVariant.types";

const productVariantModule = new ContainerModule((bind) => {
  bind<ProductVariantService>(PRODUCT_VARIANT_TYPES.ProductVariantService).to(
    ProductVariantService,
  );
  bind<ProductVariantController>(
    PRODUCT_VARIANT_TYPES.ProductVariantController,
  ).to(ProductVariantController);
  bind<ProductVariantRepository>(
    PRODUCT_VARIANT_TYPES.ProductVariantRepository,
  ).to(ProductVariantRepository);
  bind<ProductVariantRouter>(PRODUCT_VARIANT_TYPES.ProductVariantRouter).to(
    ProductVariantRouter,
  );
});

export { productVariantModule };
