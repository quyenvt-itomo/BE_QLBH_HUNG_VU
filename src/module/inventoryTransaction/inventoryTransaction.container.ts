import { ContainerModule } from "inversify";
import { INVENTORY_TRANSACTION_TYPES } from "./inventoryTransaction.types";
import { InventoryTransactionRepository } from "./inventoryTransaction.repository";
import { InventoryTransactionService } from "./inventoryTransaction.service";
import { InventoryTransactionController } from "./inventoryTransaction.controller";
import { InventoryTransactionRouter } from "./inventoryTransaction.route";

export const inventoryTransactionModule = new ContainerModule((bind) => {
  bind(INVENTORY_TRANSACTION_TYPES.Repository)
    .to(InventoryTransactionRepository)
    .inSingletonScope();
  bind(INVENTORY_TRANSACTION_TYPES.Service)
    .toDynamicValue((context) => new InventoryTransactionService(
      context.container.get(INVENTORY_TRANSACTION_TYPES.Repository),
    ))
    .inSingletonScope();
  bind(INVENTORY_TRANSACTION_TYPES.Controller)
    .toDynamicValue((context) => new InventoryTransactionController(
      context.container.get(INVENTORY_TRANSACTION_TYPES.Service),
    ))
    .inSingletonScope();
  bind(INVENTORY_TRANSACTION_TYPES.Router)
    .toDynamicValue((context) => new InventoryTransactionRouter(
      context.container.get(INVENTORY_TRANSACTION_TYPES.Controller),
    ))
    .inSingletonScope();
});
