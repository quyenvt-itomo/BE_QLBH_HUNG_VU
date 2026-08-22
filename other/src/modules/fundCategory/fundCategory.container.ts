import { ContainerModule } from "inversify";
import { FundCategoryController } from "./fundCategory.controller";
import { FundCategoryService } from "./fundCategory.service";
import { FundCategoryRepository } from "./fundCategory.repository";
import { FundCategoryRouter } from "./fundCategory.route";
import { FUND_CATEGORY_TYPES } from "./fundCategory.types";

const fundCategoryModule = new ContainerModule((bind) => {
  bind<FundCategoryService>(FUND_CATEGORY_TYPES.FundCategoryService).to(
    FundCategoryService,
  );
  bind<FundCategoryController>(FUND_CATEGORY_TYPES.FundCategoryController).to(
    FundCategoryController,
  );
  bind<FundCategoryRepository>(FUND_CATEGORY_TYPES.FundCategoryRepository).to(
    FundCategoryRepository,
  );
  bind<FundCategoryRouter>(FUND_CATEGORY_TYPES.FundCategoryRouter).to(
    FundCategoryRouter,
  );
});

export { fundCategoryModule };
