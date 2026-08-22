import { ContainerModule } from "inversify";
import { ORDER_LINE_TYPES } from "./orderLine.types";
import { OrderLineController } from "./orderLine.controller";
import { OrderLineService } from "./orderLine.service";
import { OrderLineRepository } from "./orderLine.repository";
import { OrderLineRouter } from "./orderLine.route";

export const orderLineModule = new ContainerModule((bind) => {
  bind<OrderLineController>(ORDER_LINE_TYPES.OrderLineController).to(
    OrderLineController,
  );
  bind<OrderLineService>(ORDER_LINE_TYPES.OrderLineService).to(
    OrderLineService,
  );
  bind<OrderLineRepository>(ORDER_LINE_TYPES.OrderLineRepository).to(
    OrderLineRepository,
  );
  bind<OrderLineRouter>(ORDER_LINE_TYPES.OrderLineRouter).to(OrderLineRouter);
});
