import { FindOptionsRelations } from "typeorm";
import { Order } from "@/database/models/store/Order";

export const OrderRelations: FindOptionsRelations<Order> = { partner: true, shipper: true, lines: { product: true, unit: true }, returnLines: { product: true, unit: true }, refOrder: true } as any;
export const OrderSelectFull = undefined;
