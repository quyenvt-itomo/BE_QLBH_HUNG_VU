import { FundAdjustment } from "@/database/models/FundAdjustment";
import { Fund } from "@/database/models/Fund";
import { IsNull } from "typeorm";
import { SimpleService } from "../_shared/simple.service";
import { FundAdjustmentRepository } from "./fundAdjustment.repository";
export class FundAdjustmentService extends SimpleService<FundAdjustment> { constructor(repository: FundAdjustmentRepository) { super(repository, "store", "fundadjustment"); } async validateBeforeCreate(data: any, manager: any, req?: any): Promise<void> { await super.validateBeforeCreate(data, manager, req); if (!data.fundId) throw new Error("fund.required"); const fund = await manager.getRepository(Fund).findOne({ where: { id: data.fundId, deletedAt: IsNull() } as any }); if (!fund) throw new Error("fund.not_found"); data.fundSnapshot = { id: fund.id, code: fund.code, name: fund.name, type: fund.type }; data.deltaAmount = Number(data.countedAmount || 0) - Number(data.expectedAmount || 0); } }
