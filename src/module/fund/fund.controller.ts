import { injectable, inject } from "inversify";
import { FundService } from "./fund.service";
import { FUND_TYPES } from "./fund.types";
import { BaseController } from "@/shared/base/BaseController";
import { Fund } from "@/database/models/Fund";

@injectable()
export class FundController extends BaseController<Fund> {
  protected service: FundService;

  constructor(
    @inject(FUND_TYPES.FundService)
    service: FundService,
  ) {
    super();
    this.service = service;
  }
}
