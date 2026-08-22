import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { JobPosition } from "@/database/models/company/JobPosition";
import { JobPositionService } from "./jobPosition.service";
import { JOB_POSITION_TYPES } from "./jobPosition.types";

@injectable()
export class JobPositionController extends BaseController<JobPosition> {
  protected service: JobPositionService;

  constructor(
    @inject(JOB_POSITION_TYPES.JobPositionService)
    service: JobPositionService,
  ) {
    super();
    this.service = service;
  }
}
