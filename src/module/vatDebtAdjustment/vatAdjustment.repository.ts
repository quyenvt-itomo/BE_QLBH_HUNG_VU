import { injectable } from "inversify";
import { VatAdjustment } from "@/database/models/VatDebtAdjustment";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { VatAdjustmentRelations, VatAdjustmentRelationsList, VatAdjustmentSelectFull, VatAdjustmentSelectList } from "./vatAdjustment.select";
@injectable()
export class VatAdjustmentRepository extends BaseRepository<VatAdjustment> {
  protected entityClass = VatAdjustment;
  protected selectedFields = VatAdjustmentSelectFull;
  protected selectedFieldsForList = VatAdjustmentSelectList;
  protected relations = VatAdjustmentRelations;
  protected relationsForList = VatAdjustmentRelationsList;
}
