import { ContainerModule } from "inversify";
import { JOB_POSITION_TYPES } from "./jobPosition.types";
import { JobPositionController } from "./jobPosition.controller";
import { JobPositionService } from "./jobPosition.service";
import { JobPositionRepository } from "./jobPosition.repository";
import { JobPositionRouter } from "./jobPosition.route";

const jobPositionModule = new ContainerModule((bind) => {
  bind<JobPositionController>(JOB_POSITION_TYPES.JobPositionController).to(
    JobPositionController,
  );
  bind<JobPositionService>(JOB_POSITION_TYPES.JobPositionService).to(
    JobPositionService,
  );
  bind<JobPositionRepository>(JOB_POSITION_TYPES.JobPositionRepository).to(
    JobPositionRepository,
  );
  bind<JobPositionRouter>(JOB_POSITION_TYPES.JobPositionRouter).to(
    JobPositionRouter,
  );
});

export { jobPositionModule };
