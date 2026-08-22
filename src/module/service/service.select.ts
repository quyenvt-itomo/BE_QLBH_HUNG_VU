import { Service } from "@/database/models/company/Service";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ServiceSelectFull: FindOptionsSelect<Service> = {
  ...BaseSelect,
  companyId: true,
  type: true,
  code: true,
  name: true,
  taxRate: true,
  units: {
    id: true,
    unitId: true,
    costPrice: true,
    unitPrice: true,
    unit: true,
  },
};

export const ServiceRelations: FindOptionsRelations<Service> = {
  units: { unit: true },
};
