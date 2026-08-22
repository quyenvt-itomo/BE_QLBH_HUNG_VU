import { injectable, inject } from "inversify";
import { ServiceService } from "./service.service";
import { SERVICE_TYPES } from "./service.types";
import { BaseController } from "@/shared/base/BaseController";
import { Service } from "@/database/models/company/Service";

@injectable()
export class ServiceController extends BaseController<Service> {
  protected service: ServiceService;

  constructor(@inject(SERVICE_TYPES.ServiceService) service: ServiceService) {
    super();
    this.service = service;
  }
}
