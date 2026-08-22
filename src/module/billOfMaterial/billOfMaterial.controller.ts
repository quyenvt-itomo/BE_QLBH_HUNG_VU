import { injectable, inject } from "inversify";
import { BillOfMaterialService } from "./billOfMaterial.service";
import { BILL_OF_MATERIAL_TYPES } from "./billOfMaterial.types";
import { BaseController } from "@/shared/base/BaseController";
import { BillOfMaterial } from "@/database/models/company/BillOfMaterial";

@injectable()
export class BillOfMaterialController extends BaseController<BillOfMaterial> {
  protected service: BillOfMaterialService;

  constructor(
    @inject(BILL_OF_MATERIAL_TYPES.BillOfMaterialService)
    service: BillOfMaterialService,
  ) {
    super();
    this.service = service;
  }
}
