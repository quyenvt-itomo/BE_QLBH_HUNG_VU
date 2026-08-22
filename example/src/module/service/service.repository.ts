import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Service, ServiceSnapshot } from "@/database/models/company/Service";
import { ServiceSelectFull, ServiceRelations } from "./service.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { ServiceQueryDto } from "./service.validator";

@injectable()
export class ServiceRepository extends BaseRepository<Service> {
  protected entityClass = Service;
  protected selectedFields = ServiceSelectFull;
  protected relations = ServiceRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Service>,
    options: IFindPaginationOptions<Service>,
  ): Promise<void> {
    const alias = qb.alias;
    const { type } = (options?.moreQuery as ServiceQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
  }

  async attachInfo<
    T extends {
      serviceId?: string | null;
      serviceSnapshot?: DeepPartial<ServiceSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (data.serviceId) {
      data.serviceSnapshot = await this.getSnapshot(data.serviceId, manager);
    } else {
      data.serviceSnapshot = null;
    }
  }

  async getSnapshot(
    serviceId: string,
    manager?: EntityManager,
  ): Promise<ServiceSnapshot | null> {
    const service = await this.findById(serviceId, manager);
    if (!service) return null;
    return { id: service.id, code: service.code, name: service.name };
  }
}
