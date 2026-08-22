import { ContainerModule } from "inversify";
import { ProductOptionController } from "./productOption.controller";
import { ProductOptionService } from "./productOption.service";
import { ProductOptionRepository } from "./productOption.repository";
import { ProductOptionRouter } from "./productOption.route";
import { PRODUCT_OPTION_TYPES } from "./productOption.types";

const productOptionModule = new ContainerModule((bind) => {
  bind<ProductOptionService>(PRODUCT_OPTION_TYPES.ProductOptionService).to(
    ProductOptionService,
  );
  bind<ProductOptionController>(
    PRODUCT_OPTION_TYPES.ProductOptionController,
  ).to(ProductOptionController);
  bind<ProductOptionRepository>(
    PRODUCT_OPTION_TYPES.ProductOptionRepository,
  ).to(ProductOptionRepository);
  bind<ProductOptionRouter>(PRODUCT_OPTION_TYPES.ProductOptionRouter).to(
    ProductOptionRouter,
  );
});

export { productOptionModule };
