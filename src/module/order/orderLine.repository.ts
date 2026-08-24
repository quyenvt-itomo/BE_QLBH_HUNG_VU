import { injectable } from "inversify";
import { OrderLine } from "@/database/models";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { OrderLineRelations, OrderLineRelationsList, OrderLineSelectFull, OrderLineSelectList } from "./orderLine.select";

@injectable()
export class OrderLineRepository extends BaseRepository<OrderLine> {
  protected entityClass = OrderLine;
  protected selectedFields = OrderLineSelectFull;
  protected selectedFieldsForList = OrderLineSelectList;
  protected relations = OrderLineRelations;
  protected relationsForList = OrderLineRelationsList;
}
