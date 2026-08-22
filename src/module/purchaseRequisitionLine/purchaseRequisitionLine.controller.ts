import { injectable, inject } from "inversify";
import { PurchaseRequisitionLineService } from "./purchaseRequisitionLine.service";
import { PURCHASE_REQUISITION_LINE_TYPES } from "./purchaseRequisitionLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { PurchaseRequisitionLine } from "@/database/models/company/PurchaseRequisitionLine";

@injectable()
export class PurchaseRequisitionLineController extends BaseController<PurchaseRequisitionLine> {
  protected service: PurchaseRequisitionLineService;

  constructor(
    @inject(PURCHASE_REQUISITION_LINE_TYPES.PurchaseRequisitionLineService)
    service: PurchaseRequisitionLineService,
  ) {
    super();
    this.service = service;
  }
}
