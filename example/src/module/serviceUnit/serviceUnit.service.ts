import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ServiceUnitRepository } from "./serviceUnit.repository";
import { SERVICE_UNIT_TYPES } from "./serviceUnit.types";
import { ServiceUnit } from "@/database/models/company/ServiceUnit";

@injectable()
export class ServiceUnitService extends BaseService<ServiceUnit> {
  protected repository: ServiceUnitRepository;
  protected searchableFields = [];

  constructor(
    @inject(SERVICE_UNIT_TYPES.ServiceUnitRepository)
    repository: ServiceUnitRepository,
  ) {
    super();
    this.repository = repository;
  }
}
