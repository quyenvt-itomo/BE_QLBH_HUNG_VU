import { inject, injectable } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { INVENTORY_TRANSACTION_TYPES } from "./inventoryTransaction.types";

@injectable()
export class InventoryTransactionService extends BaseService<InventoryTransaction> {
  protected repository: import("./inventoryTransaction.repository").InventoryTransactionRepository;
  constructor(@inject(INVENTORY_TRANSACTION_TYPES.Repository) repository: import("./inventoryTransaction.repository").InventoryTransactionRepository) {
    super(); this.repository = repository;
  }
  async validateBeforeCreate(): Promise<void> { throw new Error("inventoryTransaction.generated_only"); }
  async validateBeforeUpdate(): Promise<void> { throw new Error("inventoryTransaction.generated_only"); }
  async validateBeforeDelete(): Promise<void> { throw new Error("inventoryTransaction.generated_only"); }
}
