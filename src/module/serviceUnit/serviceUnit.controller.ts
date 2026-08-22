import { injectable, inject } from "inversify";
import { ServiceUnitService } from "./serviceUnit.service";
import { SERVICE_UNIT_TYPES } from "./serviceUnit.types";
import { BaseController } from "@/shared/base/BaseController";
import { ServiceUnit } from "@/database/models/company/ServiceUnit";

@injectable()
export class ServiceUnitController extends BaseController<ServiceUnit> {
  protected service: ServiceUnitService;

  constructor(
    @inject(SERVICE_UNIT_TYPES.ServiceUnitService)
    service: ServiceUnitService,
  ) {
    super();
    this.service = service;
  }
}
