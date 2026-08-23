import { Warehouse } from "@/database/models/company/Warehouse";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const WarehouseSelectFull: FindOptionsSelect<Warehouse> = {
  ...BaseSelect,
  storeId: true,
  code: true,
  name: true,
  phone: true,
  address: true,
  managerId: true,
  manager: { id: true, code: true, name: true },
};

export const WarehouseRelations: FindOptionsRelations<Warehouse> = {
  manager: true,
};
