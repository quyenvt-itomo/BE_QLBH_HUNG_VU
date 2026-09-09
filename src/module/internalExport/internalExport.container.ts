import { ContainerModule } from "inversify";
import { INTERNAL_EXPORT_TYPES } from "./internalExport.types";
import { InternalExportRepository } from "./internalExport.repository";
import { InternalExportLineRepository } from "./internalExportLine.repository";
import { InternalExportService } from "./internalExport.service";
import { InternalExportController } from "./internalExport.controller";
import { InternalExportRouter } from "./internalExport.route";
import { PRODUCT_TYPES } from "../product/product.types";
import { ATTRIBUTE_TYPES } from "../attribute/attribute.types";
import { INVENTORY_TYPES } from "../inventory/inventory.types";

export const internalExportModule = new ContainerModule((bind) => {
  bind(INTERNAL_EXPORT_TYPES.Repository).to(InternalExportRepository).inSingletonScope();
  bind(INTERNAL_EXPORT_TYPES.LineRepository).to(InternalExportLineRepository).inSingletonScope();
  bind(INTERNAL_EXPORT_TYPES.Service).toDynamicValue((context) => new InternalExportService(
    context.container.get(INTERNAL_EXPORT_TYPES.Repository),
    context.container.get(INTERNAL_EXPORT_TYPES.LineRepository),
    context.container.get(PRODUCT_TYPES.ProductRepository),
    context.container.get(ATTRIBUTE_TYPES.AttributeRepository),
    context.container.get(INVENTORY_TYPES.InventoryRecalculateService),
  )).inSingletonScope();
  bind(INTERNAL_EXPORT_TYPES.Controller).toDynamicValue((context) => new InternalExportController(
    context.container.get(INTERNAL_EXPORT_TYPES.Service),
  )).inSingletonScope();
  bind(INTERNAL_EXPORT_TYPES.Router).toDynamicValue((context) => new InternalExportRouter(
    context.container.get(INTERNAL_EXPORT_TYPES.Controller),
  )).inSingletonScope();
});
