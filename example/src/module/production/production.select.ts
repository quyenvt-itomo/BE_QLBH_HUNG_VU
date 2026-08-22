import { Production } from "@/database/models/company/Production";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ProductionSelectFull: FindOptionsSelect<Production> = {
  ...BaseSelect,
  companyId: true,
  type: true,
  timeAt: true,
  code: true,
  name: true,
  sequenceNumber: true,
  orderId: true,
  orderSnapshot: true,
  meshSpecId: true,
  meshSpecSnapshot: true,
  staffId: true,
  staffSnapshot: true,
  factoryId: true,
  factorySnapshot: true,
  exportCount: true,
  importCount: true,
  areaColumn: true,
  quantityUnitId: true,
  quantityUnitSnapshot: true,
};

export const ProductionRelations: FindOptionsRelations<Production> = {
  order: true,
  staff: true,
  meshSpec: true,
  factory: true,
  materials: true,
  receivers: true,
};
