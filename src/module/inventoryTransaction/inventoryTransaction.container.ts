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
  bind(INVENTORY_TRANSACTION_TYPES.Service).to(InventoryTransactionService).inSingletonScope();
  bind(INVENTORY_TRANSACTION_TYPES.Controller).to(InventoryTransactionController).inSingletonScope();
  bind(INVENTORY_TRANSACTION_TYPES.Router).to(InventoryTransactionRouter).inSingletonScope();
});
