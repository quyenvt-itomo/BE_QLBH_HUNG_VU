import { injectable, inject } from "inversify";
import { PurchaseLineService } from "./purchaseLine.service";
import { PURCHASE_LINE_TYPES } from "./purchaseLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { PurchaseLine } from "@/database/models/company/PurchaseLine";

@injectable()
export class PurchaseLineController extends BaseController<PurchaseLine> {
  protected service: PurchaseLineService;

  constructor(
    @inject(PURCHASE_LINE_TYPES.PurchaseLineService)
    service: PurchaseLineService,
  ) {
    super();
    this.service = service;
  }
}
