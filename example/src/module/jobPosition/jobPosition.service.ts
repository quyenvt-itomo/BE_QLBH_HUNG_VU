import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { JOB_POSITION_TYPES } from "./jobPosition.types";
import { JobPositionRepository } from "./jobPosition.repository";
import { JobPosition } from "@/database/models/company/JobPosition";

@injectable()
export class JobPositionService extends BaseService<JobPosition> {
  protected repository: JobPositionRepository;
  protected uniqueFields: (keyof JobPosition)[] = ["name"];
  protected uniqueScope?: (keyof JobPosition)[] | undefined = ["storeId"];
  protected searchableFields = ["name", "level", "note"];

  constructor(
    @inject(JOB_POSITION_TYPES.JobPositionRepository)
    repository: JobPositionRepository,
  ) {
    super();
    this.repository = repository;
  }
}
