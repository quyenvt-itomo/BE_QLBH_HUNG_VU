import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { StoreProduct } from "@/database/models/store/StoreProduct";
import { StoreProductLocation } from "@/database/models/store/StoreProductLocation";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { StoreProductRepository } from "./storeProduct.repository";
import { STORE_PRODUCT_TYPES } from "./storeProduct.types";
@injectable()
export class StoreProductService extends BaseService<StoreProduct> {
  protected repository: StoreProductRepository;
  protected uniqueFields: (keyof StoreProduct)[] = ["productId"];
  protected uniqueScope: (keyof StoreProduct)[] = ["storeId"];

  constructor(
    @inject(STORE_PRODUCT_TYPES.Repository) repository: StoreProductRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<StoreProduct>,
    _manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    data.storeId = data.storeId || req?.storeContext?.storeId;
    if (!data.storeId) throw new Error("store.required");
    delete (data as any).locations;
    delete (data as any).locationIds;
    delete (data as any).locationId;
  }

  async validateBeforeUpdate(
    _id: string,
    data: DeepPartial<StoreProduct>,
    _manager: EntityManager,
  ): Promise<void> {
    // locations are synchronized separately because TypeORM cannot update a OneToMany
    // relation through Repository.update().
    delete (data as any).locations;
    delete (data as any).locationIds;
    delete (data as any).locationId;
  }

  async actionAfterCreate(
    data: StoreProduct,
    manager: EntityManager,
    _req?: RequestContext,
    inputData?: DeepPartial<StoreProduct>,
  ): Promise<void> {
    await this.syncLocations(data.id, inputData as any, manager);
  }

  async actionAfterUpdate(
    data: StoreProduct,
    manager: EntityManager,
    _req?: RequestContext,
    inputData?: DeepPartial<StoreProduct>,
  ): Promise<void> {
    if (Object.prototype.hasOwnProperty.call(inputData || {}, "locations") ||
      Object.prototype.hasOwnProperty.call(inputData || {}, "locationIds") ||
      Object.prototype.hasOwnProperty.call(inputData || {}, "locationId")) {
      await this.syncLocations(data.id, inputData as any, manager);
    }
  }

  private async syncLocations(
    storeProductId: string,
    data: { locationIds?: string[]; locations?: Array<{ locationId?: string | null }>; locationId?: string | null },
    manager: EntityManager,
  ): Promise<void> {
    const locationIds = Array.from(
      new Set(
        (Array.isArray(data?.locationIds)
          ? data.locationIds
          : Array.isArray(data?.locations)
            ? data.locations.map((item) => item.locationId)
            : data?.locationId
              ? [data.locationId]
              : []
        ).filter((id): id is string => Boolean(id)),
      ),
    );
    const repo = manager.getRepository(StoreProductLocation);
    await repo.delete({ storeProductId });
    if (locationIds.length) {
      await repo.save(
        locationIds.map((locationId) => repo.create({ storeProductId, locationId })),
      );
    }
  }
}
