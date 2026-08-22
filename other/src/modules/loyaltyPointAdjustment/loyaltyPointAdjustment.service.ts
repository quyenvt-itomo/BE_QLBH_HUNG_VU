import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { LoyaltyPointAdjustmentRepository } from "./loyaltyPointAdjustment.repository";
import { LOYALTY_POINT_ADJUSTMENT_TYPES } from "./loyaltyPointAdjustment.types";
import { LoyaltyPointAdjustment } from "@/database/models/LoyaltyPointAdjustment";
import { Request } from "express";
import { EntityManager } from "typeorm";
import { LOYALTY_POINT_TYPES } from "../loyaltyPoint/loyaltyPoint.types";
import { LoyaltyPointRecalculateService } from "../loyaltyPoint/loyaltyPointRecalculate.service";

/**
 * LoyaltyPointAdjustment Service
 * Điều chỉnh điểm tích lũy
 */
@injectable()
export class LoyaltyPointAdjustmentService extends BaseService<LoyaltyPointAdjustment> {
  protected repository: LoyaltyPointAdjustmentRepository;
  protected uniqueFields: (keyof LoyaltyPointAdjustment)[] = ["code"];
  protected searchableFields = [
    "code",
    "reason",
    "partner.name",
    "partner.code",
  ];
  protected summaryFields?: string[] = ["totalAdjustmentPoints"];

  constructor(
    @inject(LOYALTY_POINT_ADJUSTMENT_TYPES.LoyaltyPointAdjustmentRepository)
    repository: LoyaltyPointAdjustmentRepository,
    @inject(LOYALTY_POINT_TYPES.LoyaltyPointRecalculateService)
    private loyaltyPointRecalculateService: LoyaltyPointRecalculateService,
  ) {
    super();
    this.repository = repository;
  }

  async handleAfterChangedData(
    data: LoyaltyPointAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    const oldData = await this.findById(data.id);

    // Lấy thời điểm xảy ra thay đổi để tính lại điểm tích lũy
    const fromDate = this.getEarliestDate(data.occurredAt, oldData?.occurredAt);

    const partnerIds = this.collectUniqueIds([
      data.partnerId,
      oldData?.partnerId,
    ]);

    await this.loyaltyPointRecalculateService.recalculateFromDate(
      fromDate,
      manager,
      partnerIds,
    );
  }

  async actionAfterCreate(
    data: LoyaltyPointAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterUpdate(
    data: LoyaltyPointAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterDelete(
    data: LoyaltyPointAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }
}
