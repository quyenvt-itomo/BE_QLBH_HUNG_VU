import { inject, injectable } from "inversify";
import { In } from "typeorm";
import { Partner } from "@/database/models/Partner";
import { LoyaltyPointTransaction } from "@/database/models/LoyaltyPointTransaction";
import { Order } from "@/database/models/store/Order";
import {
  LoyaltyPointTransactionType,
  LoyaltyPointRefTypeEnum,
  OrderTypeEnum,
  OrderStatusEnum,
} from "@/shared/constants/enum";
import { ApiResponse } from "@/shared/types/interfaces";
import { TransactionService } from "@/shared/base/TransactionService";
import { PARTNER_TYPES } from "../partner/partner.types";
import { PartnerRepository } from "../partner/partner.repository";
import {
  GetPartnerPointsReportQueryDto,
  GetTransactionDetailsQueryDto,
} from "./loyaltyPoint.validator";
import { FileHelper } from "@/shared/utils/file.helper";
import { LOYALTY_POINT_TYPES } from "./loyaltyPoint.types";
import { LoyaltyPointRecalculateService } from "./loyaltyPointRecalculate.service";

/**
 * Loyalty Point Service
 * Chỉ xử lý báo cáo và truy vấn
 *
 * Ghi transaction được xử lý bởi LoyaltyPointRecalculateService
 */
@injectable()
export class LoyaltyPointService extends TransactionService {
  constructor(
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepo: PartnerRepository,
    @inject(LOYALTY_POINT_TYPES.LoyaltyPointRecalculateService)
    private recalculateService: LoyaltyPointRecalculateService,
  ) {
    super();
  }

  // ========== REPORT FUNCTIONS ==========

  /**
   * Báo cáo tích điểm theo partner
   */
  async getPartnerPointsReport(
    params: GetPartnerPointsReportQueryDto,
  ): Promise<ApiResponse> {
    const { keyword, page = 1, size = 20, partnerIds, startAt, endAt } = params;

    // ===== BƯỚC 1: Lấy TẤT CẢ Partners cần truy vấn =====
    const whereConditions: any = {};
    if (partnerIds && partnerIds.length > 0) {
      whereConditions.id = In(partnerIds);
    }

    const allPartners = await this.partnerRepo.findWithPagination({
      skip: 0,
      take: 999999, // Lấy tất cả
      keyword,
      searchFields: [
        "name",
        "code",
        "email",
        "phone",
        "taxCode",
        "note",
        "group.name",
      ],
      where: whereConditions,
    });

    if (!allPartners.data || allPartners.data.length === 0) {
      return {
        message: "No partners found",
        statusCode: 200,
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          size,
          totalRecords: 0,
          totalPages: 0,
        },
        summary: {
          openingPoints: 0,
          openingRevenue: 0,
          pointsEarned: 0,
          pointsRedeemed: 0,
          pointsAdjusted: 0,
          revenueEarned: 0,
          closingPoints: 0,
          closingRevenue: 0,
        } as any,
      };
    }

    const allPartnerIds = allPartners.data.map((p) => p.id);

    // ===== BƯỚC 2: Tính điểm cho TẤT CẢ partners =====
    const partnerPointsMap = await this.calculatePartnerPoints(
      allPartnerIds,
      startAt,
      endAt,
    );

    // ===== BƯỚC 3: Tính Summary =====
    let summaryOpeningPoints = 0; // điểm đầu kỳ
    let summaryOpeningRevenue = 0; // doanh thu đầu kỳ
    let summaryPointsEarned = 0; // điểm tích trong kỳ
    let summaryPointsRedeemed = 0; // điểm dùng trong kỳ
    let summaryPointsAdjusted = 0; // điểm điều chỉnh trong kỳ
    let summaryRevenueEarned = 0; // doanh thu trong kỳ
    let summaryClosingPoints = 0; // điểm cuối kỳ
    let summaryClosingRevenue = 0; // doanh thu cuối kỳ

    const enrichedPartners: any[] = allPartners.data.map((partner: Partner) => {
      const {
        openingPoints,
        openingRevenue,
        pointsEarned,
        pointsRedeemed,
        pointsAdjusted,
        revenueEarned,
        closingPoints,
        closingRevenue,
      } = partnerPointsMap.get(partner.id) || {
        openingPoints: 0,
        openingRevenue: 0,
        pointsEarned: 0,
        pointsRedeemed: 0,
        pointsAdjusted: 0,
        revenueEarned: 0,
        closingPoints: 0,
        closingRevenue: 0,
      };

      // Cộng dồn vào summary
      summaryOpeningPoints += openingPoints;
      summaryOpeningRevenue += openingRevenue;
      summaryPointsEarned += pointsEarned;
      summaryPointsRedeemed += pointsRedeemed;
      summaryPointsAdjusted += pointsAdjusted;
      summaryRevenueEarned += revenueEarned;
      summaryClosingPoints += closingPoints;
      summaryClosingRevenue += closingRevenue;

      const partialPartner: Partial<Partner> = {
        id: partner.id,
        code: partner.code,
        name: partner.name,
        type: partner.type,
        phone: partner.phone,
        groupId: partner.groupId,
        group: partner.group,
      };

      return {
        ...partialPartner,
        openingPoints,
        openingRevenue,
        pointsEarned,
        pointsRedeemed,
        pointsAdjusted,
        revenueEarned,
        closingPoints,
        closingRevenue,
      };
    });

    // Filter ra partners có giao dịch
    const filteredPartners = enrichedPartners.filter(
      (partner) =>
        partner.openingPoints !== 0 ||
        partner.pointsEarned !== 0 ||
        partner.pointsRedeemed !== 0 ||
        partner.pointsAdjusted !== 0 ||
        partner.closingPoints !== 0,
    );

    // ===== BƯỚC 4: Phân trang =====
    const total = filteredPartners.length;
    const totalPages = Math.ceil(total / size);
    const skip = (page - 1) * size;
    const paginatedData = filteredPartners.slice(skip, skip + size);

    const result = await FileHelper.attachFilesToEntities(paginatedData);

    return {
      message: "Partner points report fetched successfully",
      statusCode: 200,
      success: true,
      data: result,
      pagination: {
        currentPage: page,
        size,
        totalRecords: total,
        totalPages,
      },
      summary: {
        openingPoints: summaryOpeningPoints,
        openingRevenue: summaryOpeningRevenue,
        pointsEarned: summaryPointsEarned,
        pointsRedeemed: summaryPointsRedeemed,
        pointsAdjusted: summaryPointsAdjusted,
        revenueEarned: summaryRevenueEarned,
        closingPoints: summaryClosingPoints,
        closingRevenue: summaryClosingRevenue,
      } as any,
    };
  }

  /**
   * Tính điểm cho nhiều partners trong khoảng thời gian
   * Sử dụng snapshot pattern để tối ưu performance
   */
  private async calculatePartnerPoints(
    partnerIds: string[],
    startAt: Date,
    endAt: Date,
  ): Promise<
    Map<
      string,
      {
        openingPoints: number;
        openingRevenue: number;
        pointsEarned: number;
        pointsRedeemed: number;
        pointsAdjusted: number;
        revenueEarned: number;
        closingPoints: number;
        closingRevenue: number;
      }
    >
  > {
    const manager = await this.getManager();
    const resultMap = new Map<
      string,
      {
        openingPoints: number;
        openingRevenue: number;
        pointsEarned: number;
        pointsRedeemed: number;
        pointsAdjusted: number;
        revenueEarned: number;
        closingPoints: number;
        closingRevenue: number;
      }
    >();

    // Tính thời điểm trước startAt để lấy opening balance
    const beforeStartAt = new Date(startAt.getTime() - 1);

    // Query CHỈ transactions trong kỳ [startAt, endAt]
    const txInPeriod = await manager
      .createQueryBuilder(LoyaltyPointTransaction, "tx")
      .where("tx.partnerId IN (:...partnerIds)", { partnerIds })
      .andWhere("tx.occurredAt >= :startAt", { startAt })
      .andWhere("tx.occurredAt <= :endAt", { endAt })
      .andWhere("tx.deletedAt IS NULL")
      .orderBy("tx.occurredAt", "ASC")
      .getMany();

    // Query CHỈ orders trong kỳ để tính revenue
    const ordersInPeriod = await manager
      .createQueryBuilder(Order, "o")
      .where("o.partnerId IN (:...partnerIds)", { partnerIds })
      .andWhere("o.orderAt >= :startAt", { startAt })
      .andWhere("o.orderAt <= :endAt", { endAt })
      .andWhere("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere("o.status = :status", { status: OrderStatusEnum.POSTED })
      .andWhere("o.deletedAt IS NULL")
      .orderBy("o.orderAt", "ASC")
      .getMany();

    for (const partnerId of partnerIds) {
      // ===== OPENING: Sử dụng snapshot pattern =====
      const openingPoints = await this.recalculateService.getPointsAtDate(
        partnerId,
        beforeStartAt,
        manager,
      );

      const openingRevenue =
        await this.recalculateService.getTotalRevenueAtDate(
          partnerId,
          beforeStartAt,
          manager,
        );

      // ===== PERIOD: Chỉ tính trong kỳ =====
      let pointsEarned = 0;
      let pointsRedeemed = 0;
      let pointsAdjusted = 0;

      // Phân loại transactions trong kỳ
      const partnerTxInPeriod = txInPeriod.filter(
        (tx) => tx.partnerId === partnerId,
      );

      partnerTxInPeriod.forEach((tx: LoyaltyPointTransaction) => {
        if (
          tx.type === LoyaltyPointTransactionType.INCREASE &&
          tx.refType === LoyaltyPointRefTypeEnum.ORDER
        ) {
          // Tích điểm từ đơn hàng
          pointsEarned += tx.points;
        } else if (
          tx.type === LoyaltyPointTransactionType.DECREASE &&
          tx.refType === LoyaltyPointRefTypeEnum.ORDER
        ) {
          // Dùng điểm trong đơn hàng
          pointsRedeemed += tx.points;
        } else if (tx.refType === LoyaltyPointRefTypeEnum.ADJUSTMENT) {
          // Điều chỉnh
          if (tx.type === LoyaltyPointTransactionType.INCREASE) {
            pointsAdjusted += tx.points;
          } else {
            pointsAdjusted -= tx.points;
          }
        }
      });

      // Revenue trong kỳ (netAmount không trừ loyalty discount)
      let revenueEarned = 0;
      const partnerOrdersInPeriod = ordersInPeriod.filter(
        (o: Order) => o.partnerId === partnerId,
      );

      partnerOrdersInPeriod.forEach((o: Order) => {
        revenueEarned += o.netAmount;
      });

      const closingPoints =
        openingPoints + pointsEarned - pointsRedeemed + pointsAdjusted;
      const closingRevenue = openingRevenue + revenueEarned;

      resultMap.set(partnerId, {
        openingPoints,
        openingRevenue,
        pointsEarned,
        pointsRedeemed,
        pointsAdjusted,
        revenueEarned,
        closingPoints,
        closingRevenue,
      });
    }

    return resultMap;
  }

  /**
   * Chi tiết giao dịch tích điểm của một partner
   * Sử dụng snapshot pattern để tối ưu performance
   */
  async getTransactionDetails(
    params: GetTransactionDetailsQueryDto,
  ): Promise<ApiResponse> {
    const { page = 1, size = 20, partnerId, startAt, endAt, type } = params;

    const manager = await this.getManager();

    // ===== OPENING: Sử dụng snapshot pattern =====
    const beforeStartAt = new Date(startAt.getTime() - 1);

    const openingPoints = await this.recalculateService.getPointsAtDate(
      partnerId,
      beforeStartAt,
      manager,
    );

    const openingRevenue = await this.recalculateService.getTotalRevenueAtDate(
      partnerId,
      beforeStartAt,
      manager,
    );

    // ===== TRANSACTIONS TRONG KỲ (với phân trang) =====
    const queryBuilder = manager
      .createQueryBuilder(LoyaltyPointTransaction, "tx")
      .where("tx.partnerId = :partnerId", { partnerId })
      .andWhere("tx.occurredAt >= :startAt", { startAt })
      .andWhere("tx.occurredAt <= :endAt", { endAt })
      .andWhere("tx.deletedAt IS NULL");

    if (type) {
      queryBuilder.andWhere("tx.type = :type", { type });
    }

    const [transactions, total] = await queryBuilder
      .orderBy("tx.occurredAt", "ASC")
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    // ===== SUMMARY: Tính tất cả transactions trong kỳ =====
    const allTxInPeriod = await manager
      .createQueryBuilder(LoyaltyPointTransaction, "tx")
      .where("tx.partnerId = :partnerId", { partnerId })
      .andWhere("tx.occurredAt >= :startAt", { startAt })
      .andWhere("tx.occurredAt <= :endAt", { endAt })
      .andWhere("tx.deletedAt IS NULL")
      .orderBy("tx.occurredAt", "ASC")
      .getMany();

    let increasePoints = 0; // điểm tăng
    let decreasePoints = 0; // điểm giảm
    let pointsEarned = 0; // điểm tích từ đơn hàng
    let pointsRedeemed = 0; // điểm dùng trong đơn hàng
    let pointsAdjusted = 0;

    allTxInPeriod.forEach((tx: LoyaltyPointTransaction) => {
      if (
        tx.type === LoyaltyPointTransactionType.INCREASE &&
        tx.refType === LoyaltyPointRefTypeEnum.ORDER
      ) {
        pointsEarned += tx.points;
        increasePoints += tx.points;
      } else if (
        tx.type === LoyaltyPointTransactionType.DECREASE &&
        tx.refType === LoyaltyPointRefTypeEnum.ORDER
      ) {
        pointsRedeemed += tx.points;
        decreasePoints += tx.points;
      } else if (tx.refType === LoyaltyPointRefTypeEnum.ADJUSTMENT) {
        if (tx.type === LoyaltyPointTransactionType.INCREASE) {
          pointsAdjusted += tx.points;
          increasePoints += tx.points;
        } else {
          pointsAdjusted -= tx.points;
          decreasePoints += tx.points;
        }
      }
    });

    // Revenue trong kỳ (netAmount không trừ loyalty discount)
    const ordersInPeriod = await manager
      .createQueryBuilder(Order, "o")
      .where("o.partnerId = :partnerId", { partnerId })
      .andWhere("o.orderAt >= :startAt", { startAt })
      .andWhere("o.orderAt <= :endAt", { endAt })
      .andWhere("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere("o.status = :status", { status: OrderStatusEnum.POSTED })
      .andWhere("o.deletedAt IS NULL")
      .orderBy("o.orderAt", "ASC")
      .getMany();

    let revenueEarned = 0;
    ordersInPeriod.forEach((o: Order) => {
      revenueEarned += o.netAmount;
    });

    const closingPoints =
      openingPoints + pointsEarned - pointsRedeemed + pointsAdjusted;
    const closingRevenue = openingRevenue + revenueEarned;

    return {
      message: "Transaction details fetched successfully",
      statusCode: 200,
      success: true,
      data: transactions,
      pagination: {
        currentPage: page,
        size,
        totalRecords: total,
        totalPages: Math.ceil(total / size),
      },
      summary: {
        openingPoints,
        openingRevenue,
        increasePoints,
        decreasePoints,
        pointsEarned,
        pointsRedeemed,
        pointsAdjusted,
        revenueEarned,
        closingPoints,
        closingRevenue,
      } as any,
    };
  }
}
