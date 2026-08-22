import { ContainerModule } from "inversify";
import { GATE_LOG_TYPES } from "./gateLog.types";
import { GateLogController } from "./gateLog.controller";
import { GateLogService } from "./gateLog.service";
import { GateLogRepository } from "./gateLog.repository";
import { GateLogRouter } from "./gateLog.route";

export const gateLogModule = new ContainerModule((bind) => {
  bind<GateLogController>(GATE_LOG_TYPES.GateLogController).to(
    GateLogController,
  );
  bind<GateLogService>(GATE_LOG_TYPES.GateLogService).to(GateLogService);
  bind<GateLogRepository>(GATE_LOG_TYPES.GateLogRepository).to(
    GateLogRepository,
  );
  bind<GateLogRouter>(GATE_LOG_TYPES.GateLogRouter).to(GateLogRouter);
});
