import { inject, injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { InventoryTransactionService } from "./inventoryTransaction.service";
import { INVENTORY_TRANSACTION_TYPES } from "./inventoryTransaction.types";

@injectable()
export class InventoryTransactionController extends BaseController<InventoryTransaction> {
  protected service: InventoryTransactionService;
  constructor(@inject(INVENTORY_TRANSACTION_TYPES.Service) service: InventoryTransactionService) { super(); this.service = service; }
}
