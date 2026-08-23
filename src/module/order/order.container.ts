import { ContainerModule } from "inversify";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./order.repository";
import { OrderRouter } from "./order.route";
import { ORDER_TYPES } from "./order.types";

const orderModule = new ContainerModule((bind) => {
  bind<OrderService>(ORDER_TYPES.OrderService).to(OrderService);
  bind<OrderController>(ORDER_TYPES.OrderController).to(OrderController);
  bind<OrderRepository>(ORDER_TYPES.OrderRepository).to(OrderRepository);
  bind<OrderRouter>(ORDER_TYPES.OrderRouter).to(OrderRouter);
});

export { orderModule };
