import { BaseRepository } from "@/shared/base/BaseRepository";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { injectable } from "inversify";
import {
  StoreTransferSelectFull,
  StoreTransferRelations,
} from "./storeTransfer.select";

/**
 * StoreTransfer Repository - Tenant Entity
 */
@injectable()
export class StoreTransferRepository extends BaseRepository<StoreTransfer> {
  protected entityClass = StoreTransfer;
  protected selectedFields = StoreTransferSelectFull;
  protected relations = StoreTransferRelations;
  protected nestedFileFields = ["lines.productVariant"];
}
