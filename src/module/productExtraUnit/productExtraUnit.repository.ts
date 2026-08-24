import { injectable } from "inversify";
import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { ProductExtraUnitRelations, ProductExtraUnitRelationsList, ProductExtraUnitSelectFull, ProductExtraUnitSelectList } from "./productExtraUnit.select";
@injectable()
export class ProductExtraUnitRepository extends BaseRepository<ProductExtraUnit> {
  protected entityClass = ProductExtraUnit;
  protected selectedFields = ProductExtraUnitSelectFull;
  protected selectedFieldsForList = ProductExtraUnitSelectList;
  protected relations = ProductExtraUnitRelations;
  protected relationsForList = ProductExtraUnitRelationsList;
}
