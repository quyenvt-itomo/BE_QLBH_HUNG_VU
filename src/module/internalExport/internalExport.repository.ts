import { injectable } from "inversify";
import { InternalExport } from "@/database/models/store/InternalExport";
import { BaseRepository } from "@/shared/base/BaseRepository";
import {
  InternalExportRelations,
  InternalExportRelationsList,
  InternalExportSelectFull,
  InternalExportSelectList,
} from "./internalExport.select";

@injectable()
export class InternalExportRepository extends BaseRepository<InternalExport> {
  protected entityClass = InternalExport;
  protected selectedFields = InternalExportSelectFull;
  protected selectedFieldsForList = InternalExportSelectList;
  protected relations = InternalExportRelations;
  protected relationsForList = InternalExportRelationsList;
}
