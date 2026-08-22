import { Order } from "@/database/models/store/Order";

export const ORDER_TYPES = {
  OrderService: Symbol.for("OrderService"),
  OrderController: Symbol.for("OrderController"),
  OrderRepository: Symbol.for("OrderRepository"),
  OrderRouter: Symbol.for("OrderRouter"),
};

export type OrderSnapshot = Pick<
  Order,
  | "id"
  | "code"
  | "type"
  | "orderAt"
  | "partnerSnapshot"
  | "employeeSnapshot"
  | "netAmount"
  | "totalAmount"
  | "status"
>;
