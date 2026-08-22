import { injectable, inject } from "inversify";
import { FundCategoryRepository } from "./fundCategory.repository";
import { FUND_CATEGORY_TYPES } from "./fundCategory.types";
import { FundCategory } from "@/database/models/FundCategory";
import {
  FundCategoryRelations,
  FundCategorySelectFull,
} from "./fundCategory.select";
import { BaseService } from "@/shared/base/BaseService";

@injectable()
export class FundCategoryService extends BaseService<FundCategory> {
  protected repository: FundCategoryRepository;
  protected findOptions = {};
  protected relations = FundCategoryRelations;
  protected selectedFields = FundCategorySelectFull;
  protected uniqueFields: (keyof FundCategory)[] = ["name"];
  protected searchableFields = ["name"];
  constructor(
    @inject(FUND_CATEGORY_TYPES.FundCategoryRepository)
    repository: FundCategoryRepository,
  ) {
    super();
    this.repository = repository;
  }
}
