import { ContainerModule } from "inversify";
import { PRODUCT_PRICE_HISTORY_TYPES } from "./productPriceHistory.types";
import { ProductPriceHistoryRepository } from "./productPriceHistory.repository";
import { ProductPriceHistoryService } from "./productPriceHistory.service";
import { ProductPriceHistoryController } from "./productPriceHistory.controller";
import { ProductPriceHistoryRouter } from "./productPriceHistory.route";
import { INVENTORY_TYPES } from "../inventory/inventory.types";

export const productPriceHistoryModule = new ContainerModule((bind) => {
  bind(PRODUCT_PRICE_HISTORY_TYPES.Repository)
    .to(ProductPriceHistoryRepository)
    .inSingletonScope();
  bind(PRODUCT_PRICE_HISTORY_TYPES.Service)
    .toDynamicValue((context) => new ProductPriceHistoryService(
      context.container.get(PRODUCT_PRICE_HISTORY_TYPES.Repository),
      context.container.get(INVENTORY_TYPES.InventoryRecalculateService),
    ))
    .inSingletonScope();
  bind(PRODUCT_PRICE_HISTORY_TYPES.Controller)
    .toDynamicValue((context) => new ProductPriceHistoryController(
      context.container.get(PRODUCT_PRICE_HISTORY_TYPES.Service),
    ))
    .inSingletonScope();
  bind(PRODUCT_PRICE_HISTORY_TYPES.Router)
    .toDynamicValue((context) => new ProductPriceHistoryRouter(
      context.container.get(PRODUCT_PRICE_HISTORY_TYPES.Controller),
    ))
    .inSingletonScope();
});
