import { injectable } from "inversify";
import { ProductPriceHistory } from "@/database/models/store/ProductPriceHistory";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { ProductPriceHistoryRelations, ProductPriceHistoryRelationsList, ProductPriceHistorySelectFull, ProductPriceHistorySelectList } from "./productPriceHistory.select";
@injectable()
export class ProductPriceHistoryRepository extends BaseRepository<ProductPriceHistory> {
  protected entityClass = ProductPriceHistory;
  protected selectedFields = ProductPriceHistorySelectFull;
  protected selectedFieldsForList = ProductPriceHistorySelectList;
  protected relations = ProductPriceHistoryRelations;
  protected relationsForList = ProductPriceHistoryRelationsList;
}
