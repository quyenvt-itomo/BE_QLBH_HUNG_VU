import { Organization } from "@/database/models/Organization";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const OrganizationSelectBasic: FindOptionsSelect<Organization> = {
  ...BaseSelect,
  name: true,
  code: true,
  type: true,
  phone: true,
  email: true,
  taxCode: true,
  address: true,
  parentId: true,
  managerId: true,
  industry: true,
  responsibility: true,
  establishment: true,
};

export const OrganizationSelectFull: FindOptionsSelect<Organization> = {
  ...OrganizationSelectBasic,
  parent: true,
  manager: true,
  operations: {
    ...BaseSelect,
    teamId: true,
    operationId: true,
    operation: true,
  },
};

export const OrganizationRelations: FindOptionsRelations<Organization> = {
  parent: true,
  manager: true,
  operations: {
    operation: true,
  },
};
