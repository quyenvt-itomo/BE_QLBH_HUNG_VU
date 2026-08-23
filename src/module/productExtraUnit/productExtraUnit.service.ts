import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";
import { SimpleService } from "../_shared/simple.service";
import { ProductExtraUnitRepository } from "./productExtraUnit.repository";
export class ProductExtraUnitService extends SimpleService<ProductExtraUnit> { constructor(repository: ProductExtraUnitRepository) { super(repository, "global"); } }
