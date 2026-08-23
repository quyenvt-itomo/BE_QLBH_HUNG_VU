import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { SimpleRepository } from "../_shared/simple.repository";
export class InventoryTransactionRepository extends SimpleRepository<InventoryTransaction> { constructor() { super(InventoryTransaction); } }
