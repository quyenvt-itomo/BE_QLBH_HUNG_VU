import { ContainerModule } from "inversify";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";
import { ProductExtraUnitController } from "./productExtraUnit.controller";
import { ProductExtraUnitService } from "./productExtraUnit.service";
import { ProductExtraUnitRepository } from "./productExtraUnit.repository";
import { ProductExtraUnitRouter } from "./productExtraUnit.route";

export const productExtraUnitModule = new ContainerModule((bind) => {
  bind<ProductExtraUnitController>(
    PRODUCT_EXTRA_UNIT_TYPES.ProductExtraUnitController,
  ).to(ProductExtraUnitController);
  bind<ProductExtraUnitService>(
    PRODUCT_EXTRA_UNIT_TYPES.ProductExtraUnitService,
  ).to(ProductExtraUnitService);
  bind<ProductExtraUnitRepository>(
    PRODUCT_EXTRA_UNIT_TYPES.ProductExtraUnitRepository,
  ).to(ProductExtraUnitRepository);
  bind<ProductExtraUnitRouter>(
    PRODUCT_EXTRA_UNIT_TYPES.ProductExtraUnitRouter,
  ).to(ProductExtraUnitRouter);
});
