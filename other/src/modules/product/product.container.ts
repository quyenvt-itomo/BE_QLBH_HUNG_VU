import { ContainerModule } from "inversify";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { ProductRepository } from "./product.repository";
import { ProductRouter } from "./product.route";
import { PRODUCT_TYPES } from "./product.types";

const productModule = new ContainerModule((bind) => {
  bind<ProductService>(PRODUCT_TYPES.ProductService).to(ProductService);
  bind<ProductController>(PRODUCT_TYPES.ProductController).to(
    ProductController,
  );
  bind<ProductRepository>(PRODUCT_TYPES.ProductRepository).to(
    ProductRepository,
  );
  bind<ProductRouter>(PRODUCT_TYPES.ProductRouter).to(ProductRouter);
});

export { productModule };
