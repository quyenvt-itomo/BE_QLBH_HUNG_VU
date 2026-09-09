import { injectable } from "inversify";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { InternalExportLine } from "@/database/models/store/InternalExportLine";
import {
  InternalExportLineSelectList,
  InternalExportLineRelations,
  InternalExportLineRelationsList,
} from "./internalExport.select";

@injectable()
export class InternalExportLineRepository extends BaseRepository<InternalExportLine> {
  protected entityClass = InternalExportLine;
  protected selectedFields = InternalExportLineSelectList;
  protected selectedFieldsForList = InternalExportLineSelectList;
  protected relations = InternalExportLineRelations;
  protected relationsForList = InternalExportLineRelationsList;
}
