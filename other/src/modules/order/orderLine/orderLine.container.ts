import { ContainerModule } from "inversify";
import { OrderLineController } from "./orderLine.controller";
import { OrderLineService } from "./orderLine.service";
import { OrderLineRepository } from "./orderLine.repository";
import { OrderLineRouter } from "./orderLine.route";
import { ORDER_LINE_TYPES } from "./orderLine.types";

const orderLineModule = new ContainerModule((bind) => {
  bind<OrderLineService>(ORDER_LINE_TYPES.OrderLineService).to(
    OrderLineService,
  );
  bind<OrderLineController>(ORDER_LINE_TYPES.OrderLineController).to(
    OrderLineController,
  );
  bind<OrderLineRepository>(ORDER_LINE_TYPES.OrderLineRepository).to(
    OrderLineRepository,
  );
  bind<OrderLineRouter>(ORDER_LINE_TYPES.OrderLineRouter).to(OrderLineRouter);
});

export { orderLineModule };
