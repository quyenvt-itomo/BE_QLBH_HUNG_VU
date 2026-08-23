import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ServiceRepository } from "./service.repository";
import { SERVICE_TYPES } from "./service.types";
import { Service } from "@/database/models/company/Service";
import { ServiceUnit } from "@/database/models/company/ServiceUnit";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";

@injectable()
export class ServiceService extends BaseService<Service> {
  protected repository: ServiceRepository;
  protected uniqueFields: (keyof Service)[] = ["code"];
  protected uniqueScope?: (keyof Service)[] = ["storeId"];
  protected searchableFields = ["name", "code", "note"];

  constructor(
    @inject(SERVICE_TYPES.ServiceRepository)
    repository: ServiceRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Service>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Service>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  /**
   * Override update: super.update() xử lý files + hooks, sau đó sync units riêng.
   */
  async update(
    id: string,
    data: DeepPartial<Service>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<Service | null> {
    const { units, ...safeData } = data as any;

    const result = await super.update(
      id,
      safeData as DeepPartial<Service>,
      manager,
      req,
    );

    if (units !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const unitRepo = trxManager.getRepository(ServiceUnit);
        const existing = await unitRepo.find({
          where: { serviceId: id } as any,
        });

        const incomingIds = new Set(
          (units as any[]).map((u: any) => u.id).filter(Boolean),
        );
        const removedIds = existing
          .map((u) => u.id)
          .filter((uid) => !incomingIds.has(uid));
        if (removedIds.length > 0) await unitRepo.softDelete(removedIds);

        const toSave = (units as any[]).map((u: any) => ({
          ...u,
          serviceId: id,
        }));
        if (toSave.length > 0) await unitRepo.save(toSave);
      };
      if (manager) await run(manager);
      else await withTransaction(run);
    }

    return result;
  }
}
