import { BaseRepository } from "@/shared/base/BaseRepository";
import { JobPosition } from "@/database/models/company/JobPosition";
import {
  JobPositionRelations,
  JobPositionSelectFull,
} from "./jobPosition.select";

export class JobPositionRepository extends BaseRepository<JobPosition> {
  protected entityClass = JobPosition;
  protected selectedFields = JobPositionSelectFull;
  protected relations = JobPositionRelations;
}
