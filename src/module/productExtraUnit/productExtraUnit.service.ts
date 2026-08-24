import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { ProductExtraUnitRepository } from "./productExtraUnit.repository";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";
@injectable()
export class ProductExtraUnitService extends BaseService<ProductExtraUnit> { protected repository: ProductExtraUnitRepository; protected uniqueFields: (keyof ProductExtraUnit)[] = ["productId", "unitId"]; constructor(@inject(PRODUCT_EXTRA_UNIT_TYPES.Repository) repository: ProductExtraUnitRepository) { super(); this.repository = repository; } async validateBeforeCreate(_data: DeepPartial<ProductExtraUnit>, _manager: EntityManager, _req?: RequestContext): Promise<void> {} }
