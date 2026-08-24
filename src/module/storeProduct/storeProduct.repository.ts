import { injectable } from "inversify";
import { StoreProduct } from "@/database/models/store/StoreProduct";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { StoreProductRelations, StoreProductRelationsList, StoreProductSelectFull, StoreProductSelectList } from "./storeProduct.select";
@injectable()
export class StoreProductRepository extends BaseRepository<StoreProduct> {
  protected entityClass = StoreProduct;
  protected selectedFields = StoreProductSelectFull;
  protected selectedFieldsForList = StoreProductSelectList;
  protected relations = StoreProductRelations;
  protected relationsForList = StoreProductRelationsList;
}
