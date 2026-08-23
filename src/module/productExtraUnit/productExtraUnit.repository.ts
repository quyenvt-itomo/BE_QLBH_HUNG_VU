import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";
import { SimpleRepository } from "../_shared/simple.repository";
export class ProductExtraUnitRepository extends SimpleRepository<ProductExtraUnit> { constructor() { super(ProductExtraUnit); } }
