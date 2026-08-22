import { ContainerModule } from "inversify";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardRepository } from "./dashboard.repository";
import { DASHBOARD_TYPES } from "./dashboard.types";
import { DashboardRouter } from "./dashboard.route";

const dashboardModule = new ContainerModule((bind) => {
  bind<DashboardRepository>(DASHBOARD_TYPES.DashboardRepository).to(
    DashboardRepository,
  );
  bind<DashboardService>(DASHBOARD_TYPES.DashboardService).to(DashboardService);
  bind<DashboardController>(DASHBOARD_TYPES.DashboardController).to(
    DashboardController,
  );
  bind<DashboardRouter>(DASHBOARD_TYPES.DashboardRouter).to(DashboardRouter);
});

export { dashboardModule };
