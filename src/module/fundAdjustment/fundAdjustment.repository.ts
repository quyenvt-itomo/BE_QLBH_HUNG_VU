import { injectable } from "inversify";
import { FundAdjustment } from "@/database/models/FundAdjustment";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { FundAdjustmentRelations, FundAdjustmentRelationsList, FundAdjustmentSelectFull, FundAdjustmentSelectList } from "./fundAdjustment.select";
@injectable()
export class FundAdjustmentRepository extends BaseRepository<FundAdjustment> {
  protected entityClass = FundAdjustment;
  protected selectedFields = FundAdjustmentSelectFull;
  protected selectedFieldsForList = FundAdjustmentSelectList;
  protected relations = FundAdjustmentRelations;
  protected relationsForList = FundAdjustmentRelationsList;
}
