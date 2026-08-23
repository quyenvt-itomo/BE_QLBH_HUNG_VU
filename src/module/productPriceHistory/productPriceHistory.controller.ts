import { injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { ProductPriceHistory } from "@/database/models/store/ProductPriceHistory";
import { ProductPriceHistoryService } from "./productPriceHistory.service";

@injectable()
export class ProductPriceHistoryController extends BaseController<ProductPriceHistory> {
  protected service: ProductPriceHistoryService;

  constructor(service: ProductPriceHistoryService) {
    super();
    this.service = service;
  }
}
