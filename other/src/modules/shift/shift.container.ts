import { ContainerModule } from "inversify";
import { SHIFT_TYPES } from "./shift.types";
import { ShiftService } from "./shift.service";
import { ShiftController } from "./shift.controller";
import { ShiftRepository } from "./shift.repository";
import { ShiftRouter } from "./shift.route";

const shiftModule = new ContainerModule((bind) => {
  bind<ShiftService>(SHIFT_TYPES.ShiftService).to(ShiftService);
  bind<ShiftController>(SHIFT_TYPES.ShiftController).to(ShiftController);
  bind<ShiftRepository>(SHIFT_TYPES.ShiftRepository).to(ShiftRepository);
  bind<ShiftRouter>(SHIFT_TYPES.ShiftRouter).to(ShiftRouter);
});

export { shiftModule };
