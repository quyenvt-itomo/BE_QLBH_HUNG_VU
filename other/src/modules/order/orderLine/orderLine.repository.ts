import { BaseRepository } from "@/shared/base/BaseRepository";
import { OrderLine } from "@/database/models/store/OrderLine";
import { OrderLineSelectFull, OrderLineRelations } from "./orderLine.select";
import { injectable } from "inversify";

/**
 * OrderLine Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class OrderLineRepository extends BaseRepository<OrderLine> {
  protected entityClass = OrderLine;
  protected selectedFields = OrderLineSelectFull;
  protected relations = OrderLineRelations;
}
