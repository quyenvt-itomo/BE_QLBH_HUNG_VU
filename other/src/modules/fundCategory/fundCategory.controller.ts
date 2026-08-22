import { injectable, inject } from "inversify";
import { FundCategoryService } from "./fundCategory.service";
import { FUND_CATEGORY_TYPES } from "./fundCategory.types";
import { BaseController } from "@/shared/base/BaseController";
import { FundCategory } from "@/database/models/FundCategory";

@injectable()
export class FundCategoryController extends BaseController<FundCategory> {
  protected service: FundCategoryService;
  constructor(
    @inject(FUND_CATEGORY_TYPES.FundCategoryService)
    service: FundCategoryService,
  ) {
    super();
    this.service = service;
  }
}
