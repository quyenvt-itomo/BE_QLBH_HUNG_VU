import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { ServiceUnit } from "@/database/models/company/ServiceUnit";
import {
  ServiceUnitSelectFull,
  ServiceUnitRelations,
} from "./serviceUnit.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { ServiceUnitQueryDto } from "./serviceUnit.validator";

@injectable()
export class ServiceUnitRepository extends BaseRepository<ServiceUnit> {
  protected entityClass = ServiceUnit;
  protected selectedFields = ServiceUnitSelectFull;
  protected relations = ServiceUnitRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<ServiceUnit>,
    options: IFindPaginationOptions<ServiceUnit>,
  ): Promise<void> {
    const alias = qb.alias;
    const { serviceId, unitId } =
      (options?.moreQuery as ServiceUnitQueryDto) || {};
    if (serviceId) {
      qb.andWhere(`${alias}.serviceId = :serviceId`, { serviceId });
    }
    if (unitId) {
      qb.andWhere(`${alias}.unitId = :unitId`, { unitId });
    }
  }
}
