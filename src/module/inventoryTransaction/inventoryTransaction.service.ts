import { inject, injectable } from "inversify";
import { SimpleService } from "../_shared/simple.service";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { INVENTORY_TRANSACTION_TYPES } from "./inventoryTransaction.types";

@injectable()
export class InventoryTransactionService extends SimpleService<InventoryTransaction> {
  constructor(@inject(INVENTORY_TRANSACTION_TYPES.Repository) repository: import("./inventoryTransaction.repository").InventoryTransactionRepository) {
    super(repository, "store");
  }
  async validateBeforeCreate(): Promise<void> { throw new Error("inventoryTransaction.generated_only"); }
  async validateBeforeUpdate(): Promise<void> { throw new Error("inventoryTransaction.generated_only"); }
  async validateBeforeDelete(): Promise<void> { throw new Error("inventoryTransaction.generated_only"); }
}
