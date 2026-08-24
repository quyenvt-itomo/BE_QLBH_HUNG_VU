export const ORDER_TYPES = {
  OrderService: Symbol.for("OrderService"),
  OrderController: Symbol.for("OrderController"),
  OrderRepository: Symbol.for("OrderRepository"),
  OrderRouter: Symbol.for("OrderRouter"),
  OrderLineRepository: Symbol.for("OrderLineRepository"),
};
export type OrderModule = "sale" | "saleReturn" | "purchase" | "purchaseReturn";
