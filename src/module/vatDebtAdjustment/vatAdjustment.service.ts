import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { VatAdjustment } from "@/database/models/VatDebtAdjustment";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { VatAdjustmentRepository } from "./vatAdjustment.repository";
import { VAT_ADJUSTMENT_TYPES } from "./vatAdjustment.types";
@injectable()
export class VatAdjustmentService extends BaseService<VatAdjustment> { protected repository: VatAdjustmentRepository; protected uniqueFields: (keyof VatAdjustment)[] = ["code"]; constructor(@inject(VAT_ADJUSTMENT_TYPES.Repository) repository: VatAdjustmentRepository) { super(); this.repository = repository; } async validateBeforeCreate(data: DeepPartial<VatAdjustment>, _manager: EntityManager, _req?: RequestContext): Promise<void> { if (data.countedAmount == null || data.expectedAmount == null) throw new Error("vatAdjustment.amount.required"); data.deltaAmount = Number(data.countedAmount) - Number(data.expectedAmount); } }
