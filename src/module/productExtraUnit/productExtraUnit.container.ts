import { createSimpleModule } from "../_shared/simple.bind";
import { ProductExtraUnitRepository } from "./productExtraUnit.repository";
import { ProductExtraUnitService } from "./productExtraUnit.service";
import { ProductExtraUnitController } from "./productExtraUnit.controller";
import { ProductExtraUnitRouter } from "./productExtraUnit.route";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";

export const productExtraUnitModule = createSimpleModule(
  PRODUCT_EXTRA_UNIT_TYPES,
  ProductExtraUnitRepository,
  ProductExtraUnitService,
  ProductExtraUnitController,
  ProductExtraUnitRouter,
);
