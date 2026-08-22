import { ServiceUnit } from "@/database/models/company/ServiceUnit";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ServiceUnitSelectFull: FindOptionsSelect<ServiceUnit> = {
  ...BaseSelect,
  serviceId: true,
  unitId: true,
  costPrice: true,
  unitPrice: true,
  unit: { id: true, name: true },
};

export const ServiceUnitRelations: FindOptionsRelations<ServiceUnit> = {
  unit: true,
};
