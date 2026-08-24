import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { Fund } from "@/database/models/Fund";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { generateCode } from "@/shared/utils/code.utils";
import { FundRepository } from "./fund.repository";
import { FUND_TYPES } from "./fund.types";

@injectable()
export class FundService extends BaseService<Fund> {
  protected repository: FundRepository;
  protected uniqueFields: (keyof Fund)[] = ["code"];
  protected uniqueScope: (keyof Fund)[] = ["storeId"];
  protected searchableFields = ["code", "name"];
  constructor(@inject(FUND_TYPES.Repository) repository: FundRepository) { super(); this.repository = repository; }
  async validateBeforeCreate(data: DeepPartial<Fund>, _manager: EntityManager, req?: RequestContext): Promise<void> {
    data.storeId = data.storeId || req?.storeContext?.storeId;
    if (!data.storeId) throw new Error("store.required");
    if (!data.code) data.code = await generateCode("fund", data.storeId);
  }
}
