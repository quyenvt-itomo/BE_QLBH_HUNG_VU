import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { OrderCommissionRepository } from "./orderCommission.repository";
import { ORDER_COMMISSION_TYPES } from "./orderCommission.types";
import { OrderCommission } from "@/database/models/store/OrderCommission";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import {
  PARTNER_CONTACT_TYPES,
  PartnerContactRepository,
} from "@/module/partnerContact";

@injectable()
export class OrderCommissionService extends BaseService<OrderCommission> {
  protected repository: OrderCommissionRepository;
  protected searchableFields = [];

  constructor(
    @inject(ORDER_COMMISSION_TYPES.OrderCommissionRepository)
    repository: OrderCommissionRepository,
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    private partnerContactRepository: PartnerContactRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<OrderCommission>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.partnerContactId) {
      data.partnerContactSnapshot =
        await this.partnerContactRepository.getSnapshot(
          data.partnerContactId,
          manager,
        );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<OrderCommission>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.partnerContactId !== undefined) {
      data.partnerContactSnapshot = data.partnerContactId
        ? await this.partnerContactRepository.getSnapshot(
            data.partnerContactId,
            manager,
          )
        : null;
    }
  }
}
