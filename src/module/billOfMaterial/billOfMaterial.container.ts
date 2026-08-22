import { ContainerModule } from "inversify";
import { BILL_OF_MATERIAL_TYPES } from "./billOfMaterial.types";
import { BillOfMaterialController } from "./billOfMaterial.controller";
import { BillOfMaterialService } from "./billOfMaterial.service";
import { BillOfMaterialRepository } from "./billOfMaterial.repository";
import { BillOfMaterialRouter } from "./billOfMaterial.route";

export const billOfMaterialModule = new ContainerModule((bind) => {
  bind<BillOfMaterialController>(
    BILL_OF_MATERIAL_TYPES.BillOfMaterialController,
  ).to(BillOfMaterialController);
  bind<BillOfMaterialService>(BILL_OF_MATERIAL_TYPES.BillOfMaterialService).to(
    BillOfMaterialService,
  );
  bind<BillOfMaterialRepository>(
    BILL_OF_MATERIAL_TYPES.BillOfMaterialRepository,
  ).to(BillOfMaterialRepository);
  bind<BillOfMaterialRouter>(BILL_OF_MATERIAL_TYPES.BillOfMaterialRouter).to(
    BillOfMaterialRouter,
  );
});
