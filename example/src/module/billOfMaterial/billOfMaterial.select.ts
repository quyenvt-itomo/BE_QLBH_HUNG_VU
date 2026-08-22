import { BillOfMaterial } from "@/database/models/company/BillOfMaterial";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const BillOfMaterialSelectFull: FindOptionsSelect<BillOfMaterial> = {
  ...BaseSelect,
  productId: true,
  unitId: true,
  product: { id: true, name: true, code: true },
  unit: { id: true, name: true },
  operations: {
    id: true,
    operationId: true,
    unitProductionCost: true,
    operation: { id: true, name: true },
  },
};

export const BillOfMaterialRelations: FindOptionsRelations<BillOfMaterial> = {
  product: true,
  unit: true,
  operations: {
    operation: true,
  },
};
