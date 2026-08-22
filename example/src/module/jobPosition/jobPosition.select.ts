import { JobPosition } from "@/database/models/company/JobPosition";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const JobPositionSelectBasic: FindOptionsSelect<JobPosition> = {
  ...BaseSelect,
  companyId: true,
  name: true,
  level: true,
  jobTitleId: true,
  jobTitleSnapshot: true,
};

export const JobPositionSelectFull: FindOptionsSelect<JobPosition> = {
  ...JobPositionSelectBasic,
  company: true,
  jobTitle: true,
};

export const JobPositionRelations: FindOptionsRelations<JobPosition> = {
  company: true,
  jobTitle: true,
};
