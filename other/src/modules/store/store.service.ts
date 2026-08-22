import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { StoreRepository } from "./store.repository";
import { STORE_TYPES } from "./store.types";
import { Store } from "@/database/models/Store";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { createPermissionsByContext } from "@/shared/middleware/permission.middleware";
import { FUND_TYPES } from "../fund/fund.types";
import { FundRepository } from "../fund/fund.repository";
import { FundTypeEnum } from "@/shared/constants/enum";

/**
 * Store Service -  Entity
 */
@injectable()
export class StoreService extends BaseService<Store> {
  protected repository: StoreRepository;
  protected uniqueFields: (keyof Store)[] = ["code", "name", "email", "phone"];
  protected searchableFields = ["code", "name", "email", "phone", "note"];

  constructor(
    @inject(STORE_TYPES.StoreRepository)
    repository: StoreRepository,
    @inject(FUND_TYPES.FundRepository)
    private fundRepository: FundRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Store>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Tạo sẵn role mặc định khi tạo store
    data.roles = [
      {
        name: "Quản lý cửa hàng",
        permissions: createPermissionsByContext("store"),
      },
      {
        name: "Nhân viên cửa hàng",
        permissions: createPermissionsByContext("store", "empty"),
      },
    ];
  }

  async actionAfterCreate(
    data: Store,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const existedFundCount = await this.fundRepository.count(
      { where: { storeId: data.id } as any },
      manager,
    );

    if (existedFundCount === 0) {
      await this.fundRepository.create(
        {
          storeId: data.id,
          name: "Tiền Mặt",
          type: FundTypeEnum.CASH,
          isDefault: true,
        } as any,
        manager,
      );
    }
  }
}
