import { injectable } from "inversify";
import { DebtAdjustment } from "@/database/models/DebtAdjustment";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { DebtAdjustmentRelations, DebtAdjustmentRelationsList, DebtAdjustmentSelectFull, DebtAdjustmentSelectList } from "./debtAdjustment.select";
@injectable()
export class DebtAdjustmentRepository extends BaseRepository<DebtAdjustment> {
  protected entityClass = DebtAdjustment;
  protected selectedFields = DebtAdjustmentSelectFull;
  protected selectedFieldsForList = DebtAdjustmentSelectList;
  protected relations = DebtAdjustmentRelations;
  protected relationsForList = DebtAdjustmentRelationsList;
}
