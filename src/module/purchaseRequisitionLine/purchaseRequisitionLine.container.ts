import { ContainerModule } from "inversify";
import { PURCHASE_REQUISITION_LINE_TYPES } from "./purchaseRequisitionLine.types";
import { PurchaseRequisitionLineController } from "./purchaseRequisitionLine.controller";
import { PurchaseRequisitionLineService } from "./purchaseRequisitionLine.service";
import { PurchaseRequisitionLineRepository } from "./purchaseRequisitionLine.repository";
import { PurchaseRequisitionLineRouter } from "./purchaseRequisitionLine.route";

export const purchaseRequisitionLineModule = new ContainerModule((bind) => {
  bind<PurchaseRequisitionLineController>(
    PURCHASE_REQUISITION_LINE_TYPES.PurchaseRequisitionLineController,
  ).to(PurchaseRequisitionLineController);
  bind<PurchaseRequisitionLineService>(
    PURCHASE_REQUISITION_LINE_TYPES.PurchaseRequisitionLineService,
  ).to(PurchaseRequisitionLineService);
  bind<PurchaseRequisitionLineRepository>(
    PURCHASE_REQUISITION_LINE_TYPES.PurchaseRequisitionLineRepository,
  ).to(PurchaseRequisitionLineRepository);
  bind<PurchaseRequisitionLineRouter>(
    PURCHASE_REQUISITION_LINE_TYPES.PurchaseRequisitionLineRouter,
  ).to(PurchaseRequisitionLineRouter);
});
