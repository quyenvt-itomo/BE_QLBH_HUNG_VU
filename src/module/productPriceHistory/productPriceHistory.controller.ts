import { inject, injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { ProductPriceHistory } from "@/database/models/store/ProductPriceHistory";
import { ProductPriceHistoryService } from "./productPriceHistory.service";
import { PRODUCT_PRICE_HISTORY_TYPES } from "./productPriceHistory.types";

@injectable()
export class ProductPriceHistoryController extends BaseController<ProductPriceHistory> {
  protected service: ProductPriceHistoryService;

  constructor(@inject(PRODUCT_PRICE_HISTORY_TYPES.Service) service: ProductPriceHistoryService) {
    super();
    this.service = service;
  }
}
