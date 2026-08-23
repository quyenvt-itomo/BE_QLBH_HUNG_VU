import { injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { InventoryTransactionService } from "./inventoryTransaction.service";

@injectable()
export class InventoryTransactionController extends BaseController<InventoryTransaction> {
  protected service: InventoryTransactionService;
  constructor(service: InventoryTransactionService) { super(); this.service = service; }
}
