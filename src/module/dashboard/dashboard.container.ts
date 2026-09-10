import { ContainerModule } from "inversify";
import { DashboardController } from "./dashboard.controller";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardRouter } from "./dashboard.route";
import { DashboardService } from "./dashboard.service";
import { DASHBOARD_TYPES } from "./dashboard.types";

export const dashboardModule = new ContainerModule((bind) => {
  bind(DASHBOARD_TYPES.Repository).to(DashboardRepository).inSingletonScope();
  bind(DASHBOARD_TYPES.Service).to(DashboardService).inSingletonScope();
  bind(DASHBOARD_TYPES.Controller).to(DashboardController).inSingletonScope();
  bind(DASHBOARD_TYPES.Router).to(DashboardRouter).inSingletonScope();
});
