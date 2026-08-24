import { ContainerModule } from "inversify";
import { ProductExtraUnitRepository } from "./productExtraUnit.repository";
import { ProductExtraUnitService } from "./productExtraUnit.service";
import { ProductExtraUnitController } from "./productExtraUnit.controller";
import { ProductExtraUnitRouter } from "./productExtraUnit.route";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";

export const productExtraUnitModule = new ContainerModule((bind) => { bind(PRODUCT_EXTRA_UNIT_TYPES.Repository).to(ProductExtraUnitRepository).inSingletonScope(); bind(PRODUCT_EXTRA_UNIT_TYPES.Service).to(ProductExtraUnitService).inSingletonScope(); bind(PRODUCT_EXTRA_UNIT_TYPES.Controller).to(ProductExtraUnitController).inSingletonScope(); bind(PRODUCT_EXTRA_UNIT_TYPES.Router).to(ProductExtraUnitRouter).inSingletonScope(); });
