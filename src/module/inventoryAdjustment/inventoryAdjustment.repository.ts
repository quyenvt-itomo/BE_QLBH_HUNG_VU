import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { SimpleRepository } from "../_shared/simple.repository";
export class InventoryAdjustmentRepository extends SimpleRepository<InventoryAdjustment> { constructor() { super(InventoryAdjustment, undefined, { lines: { product: true } }); } }
