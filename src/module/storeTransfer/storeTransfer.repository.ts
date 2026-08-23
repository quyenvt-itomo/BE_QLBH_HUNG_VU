import { StoreTransfer } from "@/database/models/StoreTransfer";
import { SimpleRepository } from "../_shared/simple.repository";
export class StoreTransferRepository extends SimpleRepository<StoreTransfer> { constructor() { super(StoreTransfer, undefined, { lines: { product: true } }); } }
