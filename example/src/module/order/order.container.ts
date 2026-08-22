import { ContainerModule } from "inversify";
import { ORDER_TYPES } from "./order.types";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./order.repository";
import { OrderRouter } from "./order.route";

export const orderModule = new ContainerModule((bind) => {
  bind<OrderController>(ORDER_TYPES.OrderController).to(OrderController);
  bind<OrderService>(ORDER_TYPES.OrderService).to(OrderService);
  bind<OrderRepository>(ORDER_TYPES.OrderRepository).to(OrderRepository);
  bind<OrderRouter>(ORDER_TYPES.OrderRouter).to(OrderRouter);
});
