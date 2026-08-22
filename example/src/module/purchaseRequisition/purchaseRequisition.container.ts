import { ContainerModule } from "inversify";
import { PURCHASE_REQUISITION_TYPES } from "./purchaseRequisition.types";
import { PurchaseRequisitionController } from "./purchaseRequisition.controller";
import { PurchaseRequisitionService } from "./purchaseRequisition.service";
import { PurchaseRequisitionRepository } from "./purchaseRequisition.repository";
import { PurchaseRequisitionRouter } from "./purchaseRequisition.route";

export const purchaseRequisitionModule = new ContainerModule((bind) => {
  bind<PurchaseRequisitionController>(
    PURCHASE_REQUISITION_TYPES.PurchaseRequisitionController,
  ).to(PurchaseRequisitionController);
  bind<PurchaseRequisitionService>(
    PURCHASE_REQUISITION_TYPES.PurchaseRequisitionService,
  ).to(PurchaseRequisitionService);
  bind<PurchaseRequisitionRepository>(
    PURCHASE_REQUISITION_TYPES.PurchaseRequisitionRepository,
  ).to(PurchaseRequisitionRepository);
  bind<PurchaseRequisitionRouter>(
    PURCHASE_REQUISITION_TYPES.PurchaseRequisitionRouter,
  ).to(PurchaseRequisitionRouter);
});
