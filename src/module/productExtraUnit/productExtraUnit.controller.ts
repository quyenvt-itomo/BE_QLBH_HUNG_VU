import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";
import { SimpleController } from "../_shared/simple.controller";
import { ProductExtraUnitService } from "./productExtraUnit.service";
export class ProductExtraUnitController extends SimpleController<ProductExtraUnit> { constructor(service: ProductExtraUnitService) { super(service); } }
