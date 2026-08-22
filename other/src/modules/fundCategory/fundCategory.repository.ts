import { BaseRepository } from "@/shared/base/BaseRepository";
import { FundCategory } from "@/database/models/FundCategory";
import {
  FundCategorySelectFull,
  FundCategoryRelations,
} from "./fundCategory.select";
import { injectable } from "inversify";

@injectable()
export class FundCategoryRepository extends BaseRepository<FundCategory> {
  protected entityClass = FundCategory;
  protected selectedFields = FundCategorySelectFull;
  protected relations = FundCategoryRelations;
}
