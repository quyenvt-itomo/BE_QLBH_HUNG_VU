import { inject, injectable } from "inversify";
import { Fund } from "@/database/models/Fund";
import { BaseController } from "@/shared/base/BaseController";
import { FundService } from "./fund.service";
import { FUND_TYPES } from "./fund.types";
@injectable()
export class FundController extends BaseController<Fund> {
  protected service: FundService;
  constructor(@inject(FUND_TYPES.Service) service: FundService) { super(); this.service = service; }
}
