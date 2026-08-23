import { StoreProduct } from "@/database/models/store/StoreProduct";
import { SimpleRepository } from "../_shared/simple.repository";
export class StoreProductRepository extends SimpleRepository<StoreProduct> { constructor() { super(StoreProduct, undefined, { product: true, store: true }); } }
