import { BaseRepository } from "@/shared/base/BaseRepository";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";
import { injectable } from "inversify";
import {
  StoreTransferLineSelectFull,
  StoreTransferLineRelations,
} from "./storeTransferLine.select";

/**
 * StoreTransferLine Repository - Tenant Entity
 */
@injectable()
export class StoreTransferLineRepository extends BaseRepository<StoreTransferLine> {
  protected entityClass = StoreTransferLine;
  protected selectedFields = StoreTransferLineSelectFull;
  protected relations = StoreTransferLineRelations;
}
