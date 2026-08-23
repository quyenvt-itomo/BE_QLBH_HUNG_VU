import { injectable, inject } from "inversify";
import { FUND_TYPES } from "../fund/fund.types";
import { FundRepository } from "../fund/fund.repository";
import { TransactionService } from "@/shared/base/TransactionService";
import {
  GetFundTransactionReportQueryDto,
  GetTransactionDetailsQueryDto,
} from "./fundTransaction.validator";
import { In } from "typeorm";
import { FundSnapshot } from "@/database/models/FundSnapshot";
import { FundTransaction } from "@/database/models/FundTransaction";
import { FundTransactionType } from "@/shared/constants/enum";
import { Fund } from "@/database/models/Fund";
import logger from "@/shared/utils/logger";
import { ApiResponse } from "@/shared/types/interfaces";

@injectable()
export class FundTransactionService extends TransactionService {
  constructor(
    @inject(FUND_TYPES.FundRepository) private fundRepo: FundRepository,
  ) {
    super();
  }

  /**
   * Báo cáo tồn quỹ theo funds
   */
  async getReport(
    params: GetFundTransactionReportQueryDto,
  ): Promise<ApiResponse> {
    const {
      keyword,
      page = 1,
      size = 20,
      fundIds,
      startAt,
      endAt,
      storeId,
    } = params;

    // ===== BƯỚC 1: Lấy TẤT CẢ Funds cần truy vấn (không phân trang) =====
    const whereConditions: any = {};
    if (fundIds && fundIds.length > 0) {
      whereConditions.id = In(fundIds);
    }

    // Lấy tất cả funds để tính summary
    const allFunds = await this.fundRepo.findWithPagination({
      skip: 0,
      take: 999999, // Lấy tất cả
      keyword,
      storeId,
      searchFields: [
        "code",
        "name",
        "bank",
        "accountNumber",
        "accountHolderName",
        "branch",
      ],
      where: whereConditions,
    });

    if (!allFunds.data || allFunds.data.length === 0) {
      return {
        message: "No funds found",
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
          openingAmount: 0,
          increaseAmount: 0,
          decreaseAmount: 0,
          closingAmount: 0,
        },
      };
    }

    // Thu thập tất cả fundIds từ funds
    const allFundIds = allFunds.data.map((p) => p.id);
    if (allFundIds.length === 0) {
      return {
        message: "No funds found",
        statusCode: 200,
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          size,
          totalRecords: allFunds.total,
          totalPages: Math.ceil(allFunds.total / size),
        },
        summary: {
          openingQty: 0,
          openingAmount: 0,
          increaseQty: 0,
          increaseAmount: 0,
          decreaseQty: 0,
          decreaseAmount: 0,
          closingQty: 0,
          closingAmount: 0,
        },
      };
    }

    // ===== BƯỚC 2: Tính tồn quỹ cho TẤT CẢ funds =====
    const fundDebtMap = await this.calculateFundBalance(
      allFundIds,
      startAt,
      endAt,
    );

    // ===== BƯỚC 3: Tính Summary =====
    let summaryOpeningAmount = 0;
    let summaryIncreaseAmount = 0;
    let summaryDecreaseAmount = 0;
    let summaryClosingAmount = 0;

    const enrichedFunds: any = allFunds.data.map((fund) => {
      const { openingAmount, increaseAmount, decreaseAmount, closingAmount } =
        fundDebtMap.get(fund.id) || {
          openingAmount: 0,
          increaseAmount: 0,
          decreaseAmount: 0,
          closingAmount: 0,
        };

      // Cộng dồn vào summary tổng
      summaryOpeningAmount += openingAmount;
      summaryIncreaseAmount += increaseAmount;
      summaryDecreaseAmount += decreaseAmount;
      summaryClosingAmount += closingAmount;

      return {
        ...fund,
        openingAmount,
        increaseAmount,
        decreaseAmount,
        closingAmount,
      };
    });

    // ===== BƯỚC 4: Áp dụng phân trang =====
    const total = enrichedFunds.length;
    const totalPages = Math.ceil(total / size);
    const skip = (page - 1) * size;
    const paginatedData = enrichedFunds.slice(skip, skip + size);

    return {
      message: "Fund transaction report fetched successfully",
      statusCode: 200,
      success: true,
      data: paginatedData,
      pagination: {
        currentPage: page,
        size,
        totalRecords: total,
        totalPages,
      },
      summary: {
        openingAmount: summaryOpeningAmount,
        increaseAmount: summaryIncreaseAmount,
        decreaseAmount: summaryDecreaseAmount,
        closingAmount: summaryClosingAmount,
      },
    };
  }

  /**
   * Tính tồn quỹ cho danh sách fundIds
   * Trả về Map<fundId, debtData>
   */
  async calculateFundBalance(
    fundIds: string[],
    startAt: Date,
    endAt: Date,
  ): Promise<
    Map<
      string,
      {
        openingAmount: number;
        increaseAmount: number;
        decreaseAmount: number;
        closingAmount: number;
      }
    >
  > {
    const result = new Map<
      string,
      {
        openingAmount: number;
        increaseAmount: number;
        decreaseAmount: number;
        closingAmount: number;
      }
    >();

    const manager = await this.getManager();

    /**
     * ===== 1. Lấy snapshot gần nhất trước startAt cho mỗi fund
     */
    const snapshots = await manager
      .createQueryBuilder(FundSnapshot, "s")
      .where("s.fundId IN (:...fundIds)", { fundIds })
      .andWhere("s.snapshotAt <= :startAt", { startAt })
      .getMany();

    /**
     * Map fundId -> snapshot gần nhất
     */
    const snapshotMap = new Map<string, { snapshotAt: Date; amount: number }>();

    for (const snap of snapshots) {
      const exist = snapshotMap.get(snap.fundId);
      if (!exist || snap.snapshotAt > exist.snapshotAt) {
        snapshotMap.set(snap.fundId, {
          snapshotAt: snap.snapshotAt,
          amount: snap.amount,
        });
      }
    }

    /**
     * ===== 2. Lấy toàn bộ transaction cần thiết
     * (từ snapshot sớm nhất → endAt)
     * Nếu có fund nào không có snapshot, cần load từ đầu
     */
    let minSnapshotAt = startAt;

    if (snapshotMap.size < fundIds.length) {
      // Có ít nhất 1 fund không có snapshot, cần load tất cả tx từ đầu
      minSnapshotAt = new Date(0);
    } else {
      // Tất cả funds đều có snapshot, tìm snapshot sớm nhất
      snapshotMap.forEach((s) => {
        if (s.snapshotAt < minSnapshotAt) {
          minSnapshotAt = s.snapshotAt;
        }
      });
    }

    const transactions = await manager
      .createQueryBuilder(FundTransaction, "tx")
      .where("tx.fundId IN (:...fundIds)", { fundIds })
      .andWhere("tx.occurredAt >= :minSnapshotAt", { minSnapshotAt })
      .andWhere("tx.occurredAt <= :endAt", { endAt })
      .getMany();

    /**
     * ===== 3. Tính cho từng fund
     */
    for (const fundId of fundIds) {
      const snapshot = snapshotMap.get(fundId);

      let openingAmount = snapshot ? snapshot.amount : 0;
      let increaseAmount = 0;
      let decreaseAmount = 0;

      const snapshotAt = snapshot?.snapshotAt ?? new Date(0);

      /**
       * 3.1 Hiệu chỉnh tồn đầu kỳ (tx sau snapshot → trước startAt)
       */
      for (const tx of transactions) {
        if (
          tx.fundId === fundId &&
          tx.occurredAt > snapshotAt &&
          tx.occurredAt < startAt
        ) {
          openingAmount +=
            tx.type === FundTransactionType.INCREASE ? tx.amount : -tx.amount;
        }
      }

      /**
       * 3.2 Transaction trong kỳ
       */
      for (const tx of transactions) {
        if (
          tx.fundId === fundId &&
          tx.occurredAt >= startAt &&
          tx.occurredAt <= endAt
        ) {
          if (tx.type === FundTransactionType.INCREASE) {
            increaseAmount += tx.amount;
          } else {
            decreaseAmount += tx.amount;
          }
        }
      }

      const closingAmount = openingAmount + increaseAmount - decreaseAmount;

      result.set(fundId, {
        openingAmount,
        increaseAmount,
        decreaseAmount,
        closingAmount,
      });
    }

    return result;
  }

  /**
   * Chi tiết transactions theo quỹ
   */
  async getTransactionDetails(
    params: GetTransactionDetailsQueryDto,
  ): Promise<ApiResponse> {
    const { fundId, startAt, endAt, storeId } = params;
    const manager = await this.getManager();

    if (storeId) {
      const fund = await this.fundRepo.findOne({
        where: { id: fundId, storeId } as any,
        select: { id: true } as any,
      });

      if (!fund) {
        return {
          message: "Fund not found in store",
          statusCode: 404,
          success: false,
          data: [],
          summary: {
            openingAmount: 0,
            totalIncreaseAmount: 0,
            totalDecreaseAmount: 0,
            closingAmount: 0,
          },
        };
      }
    }

    /**
     * ===== 1. Snapshot gần nhất trước startAt
     */
    const snapshot = await manager
      .createQueryBuilder(FundSnapshot, "s")
      .where("s.fundId = :fundId", { fundId })
      .andWhere("s.snapshotAt <= :startAt", { startAt })
      .orderBy("s.snapshotAt", "DESC")
      .getOne();

    let openingAmount = snapshot ? snapshot.amount : 0;
    const snapshotAt = snapshot?.snapshotAt ?? new Date(0);

    /**
     * ===== 2. Lấy toàn bộ transaction cần thiết
     */
    const transactions = await manager
      .createQueryBuilder(FundTransaction, "tx")
      .where("tx.fundId = :fundId", { fundId })
      .andWhere("tx.occurredAt >= :snapshotAt", { snapshotAt })
      .andWhere("tx.occurredAt <= :endAt", { endAt })
      .orderBy("tx.occurredAt", "ASC")
      .getMany();

    /**
     * ===== 3. Tính opening + phân loại transaction trong kỳ
     */
    let totalIncreaseAmount = 0;
    let totalDecreaseAmount = 0;
    const dataRes: FundTransaction[] = [];

    for (const tx of transactions) {
      if (tx.occurredAt < startAt) {
        // Hiệu chỉnh tồn đầu kỳ
        openingAmount +=
          tx.type === FundTransactionType.INCREASE ? tx.amount : -tx.amount;
      } else {
        // Transaction trong kỳ
        dataRes.push(tx);
        if (tx.type === FundTransactionType.INCREASE) {
          totalIncreaseAmount += tx.amount;
        } else {
          totalDecreaseAmount += tx.amount;
        }
      }
    }

    /**
     * ===== 4. Tồn cuối kỳ
     */
    const closingAmount =
      openingAmount + totalIncreaseAmount - totalDecreaseAmount;

    return {
      message: "Transaction details fetched successfully",
      statusCode: 200,
      success: true,
      data: dataRes,
      summary: {
        openingAmount,
        totalIncreaseAmount,
        totalDecreaseAmount,
        closingAmount,
      },
    };
  }

  /**
   * Enrich funds với số dư tại offsetAt
   */
  async enrichFundsWithBalance(funds: Fund[], offsetAt: Date): Promise<Fund[]> {
    try {
      if (!funds || funds.length === 0) return funds;

      const fundIds = funds.map((f) => f.id);

      const manager = await this.getManager();

      // Lấy snapshot gần nhất trước offsetAt cho mỗi fund
      const snapshots = await manager
        .createQueryBuilder(FundSnapshot, "s")
        .where("s.fundId IN (:...fundIds)", { fundIds })
        .andWhere("s.snapshotAt <= :offsetAt", { offsetAt })
        .getMany();

      /**
       * Map fundId -> snapshot gần nhất
       */
      const snapshotMap = new Map<
        string,
        { snapshotAt: Date; amount: number }
      >();
      for (const snap of snapshots) {
        const exist = snapshotMap.get(snap.fundId);
        if (!exist || snap.snapshotAt > exist.snapshotAt) {
          snapshotMap.set(snap.fundId, {
            snapshotAt: snap.snapshotAt,
            amount: snap.amount,
          });
        }
      }

      // Lấy toàn bộ transaction cần thiết (từ snapshot sớm nhất → offsetAt)
      // Nếu không có snapshot nào, lấy từ đầu (new Date(0))
      let minSnapshotAt = snapshotMap.size > 0 ? offsetAt : new Date(0);
      snapshotMap.forEach((s) => {
        if (s.snapshotAt < minSnapshotAt) {
          minSnapshotAt = s.snapshotAt;
        }
      });
      const transactions = await manager
        .createQueryBuilder(FundTransaction, "tx")
        .where("tx.fundId IN (:...fundIds)", { fundIds })
        .andWhere("tx.occurredAt >= :minSnapshotAt", { minSnapshotAt })
        .andWhere("tx.occurredAt <= :offsetAt", { offsetAt })
        .getMany();

      // Tính số dư cho từng fund
      funds.forEach((fund) => {
        const snapshot = snapshotMap.get(fund.id);
        let balance = snapshot ? snapshot.amount : 0;
        const snapshotAt = snapshot?.snapshotAt ?? new Date(0);
        for (const tx of transactions) {
          if (tx.fundId === fund.id && tx.occurredAt > snapshotAt) {
            const sign = tx.type === FundTransactionType.INCREASE ? 1 : -1;
            balance += sign * tx.amount;
          }
        }
        (fund as any).currentBalance = balance;
      });

      return funds;
    } catch (error) {
      logger.error("FundRepository::enrichFundsWithBalance -> ", error);
      return funds;
    }
  }
}
