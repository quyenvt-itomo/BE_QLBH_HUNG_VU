import { ContainerModule } from "inversify";
import { ORDER_COMMISSION_TYPES } from "./orderCommission.types";
import { OrderCommissionController } from "./orderCommission.controller";
import { OrderCommissionService } from "./orderCommission.service";
import { OrderCommissionRepository } from "./orderCommission.repository";
import { OrderCommissionRouter } from "./orderCommission.route";

export const orderCommissionModule = new ContainerModule((bind) => {
  bind<OrderCommissionController>(
    ORDER_COMMISSION_TYPES.OrderCommissionController,
  ).to(OrderCommissionController);
  bind<OrderCommissionService>(
    ORDER_COMMISSION_TYPES.OrderCommissionService,
  ).to(OrderCommissionService);
  bind<OrderCommissionRepository>(
    ORDER_COMMISSION_TYPES.OrderCommissionRepository,
  ).to(OrderCommissionRepository);
  bind<OrderCommissionRouter>(ORDER_COMMISSION_TYPES.OrderCommissionRouter).to(
    OrderCommissionRouter,
  );
});
