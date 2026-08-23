import { ProductPriceHistory } from "@/database/models/store/ProductPriceHistory";
import { SimpleRepository } from "../_shared/simple.repository";
export class ProductPriceHistoryRepository extends SimpleRepository<ProductPriceHistory> { constructor() { super(ProductPriceHistory, undefined, { product: true }); } }
