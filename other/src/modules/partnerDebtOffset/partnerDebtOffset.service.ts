import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerDebtOffsetRepository } from "./partnerDebtOffset.repository";
import { PARTNER_DEBT_OFFSET_TYPES } from "./partnerDebtOffset.types";
import { PartnerDebtOffset } from "@/database/models/store/PartnerDebtOffset";
import { Request } from "express";
import { EntityManager } from "typeorm";
import { PARTNER_DEBT_TYPES } from "../partnerDebt/partnerDebt.types";
import { PartnerDebtRecalculateService } from "../partnerDebt/partnerDebtRecalculate.service";
import { PartnerDebtService } from "../partnerDebt/partnerDebt.service";
import { CreatePartnerDebtOffsetDto } from "./partnerDebtOffset.validator";
import { BadRequestError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";

/**
 * PartnerDebtOffset Service - Tenant Entity
 */
@injectable()
export class PartnerDebtOffsetService extends BaseService<PartnerDebtOffset> {
  protected repository: PartnerDebtOffsetRepository;
  protected uniqueFields: (keyof PartnerDebtOffset)[] = ["code"];
  protected searchableFields = [
    "code",
    "reason",
    "note",
    "partner.name",
    "partner.code",
    "offsetBy.name",
    "offsetBy.code",
  ];
  protected summaryFields?: string[] = ["offsetAmount"];

  constructor(
    @inject(PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetRepository)
    repository: PartnerDebtOffsetRepository,
    @inject(PARTNER_DEBT_TYPES.PartnerDebtRecalculateService)
    private partnerDebtRecalculateService: PartnerDebtRecalculateService,
    @inject(PARTNER_DEBT_TYPES.PartnerDebtService)
    private partnerDebtService: PartnerDebtService,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: CreatePartnerDebtOffsetDto,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { payableDebtAmount, receivableDebtAmount } =
      await this.partnerDebtService.getDebtAtDate(
        data.partnerId,
        data.occurredAt,
        data.storeId,
      );

    const maxOffsetAmount = Math.min(payableDebtAmount, receivableDebtAmount);

    if (data.offsetAmount > maxOffsetAmount) {
      throw new BadRequestError(
        `Số tiền bù trừ vượt quá số tiền công nợ có thể bù trừ. Số tiền tối đa có thể bù trừ là ${maxOffsetAmount}`,
        {
          field: "offsetAmount",
          code: ErrorsMessages.max,
        },
      );
    }
  }

  async handleAfterChangedData(
    data: PartnerDebtOffset,
    manager: EntityManager,
  ): Promise<void> {
    const oldData = await this.findById(data.id);

    // Lấy thời điểm xảy ra thay đổi để tính lại công nợ
    const fromDate = this.getEarliestDate(data.occurredAt, oldData?.occurredAt);

    const partnerIds = this.collectUniqueIds([
      data.partnerId,
      oldData?.partnerId,
    ]);

    await this.partnerDebtRecalculateService.recalculateFromDate(
      data.storeId,
      fromDate,
      manager,
      partnerIds,
    );
  }

  async actionAfterCreate(
    data: PartnerDebtOffset,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterUpdate(
    data: PartnerDebtOffset,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterDelete(
    data: PartnerDebtOffset,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }
}
