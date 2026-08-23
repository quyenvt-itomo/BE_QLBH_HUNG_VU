import { injectable } from "inversify";
import { TransactionService } from "@/shared/base/TransactionService";
import { FundTransaction } from "@/database/models/company/FundTransaction";
import { Fund } from "@/database/models/company/Fund";
import { TransactionType } from "@/shared/constants/enum";
import { ApiResponse } from "@/shared/types/interfaces";
import {
  FundBalanceReportQueryDto,
  FundBalanceDetailQueryDto,
} from "./fundBalanceReport.validator";

@injectable()
export class FundBalanceReportService extends TransactionService {
  /**
   * Báo cáo số dư quỹ theo kỳ: opening / thu / chi / closing
   */
  async getReport(params: FundBalanceReportQueryDto): Promise<ApiResponse> {
    const {
      companyId,
      page = 1,
      size = 20,
      fundIds,
      startAt = new Date(new Date().getFullYear(), 0, 1),
      endAt = new Date(),
      sortBy = "closingAmount",
      sortOrder = "DESC",
    } = params;

    const manager = await this.getManager();

    // Filter funds by companyId
    const fundsQb = manager
      .createQueryBuilder(Fund, "fund")
      .where("fund.companyId = :companyId", { companyId })
      .andWhere("fund.deletedAt IS NULL");

    if (this.checkArrayFilter(fundIds)) {
      fundsQb.andWhere("fund.id IN (:...fundIds)", { fundIds });
    }

    const filteredFunds = await fundsQb.getMany();
    if (!filteredFunds.length) {
      return {
        success: true,
        statusCode: 200,
        message: "No funds found.",
        data: [],
        pagination: { currentPage: page, size, totalRecords: 0, totalPages: 0 },
        summary: {
          openingAmount: 0,
          inAmount: 0,
          outAmount: 0,
          closingAmount: 0,
        },
      };
    }

    const allowedFundIds = filteredFunds.map((f) => f.id);
    const fundMap = new Map(filteredFunds.map((f) => [f.id, f]));

    const qb = manager
      .createQueryBuilder(FundTransaction, "tx")
      .select("tx.fundId", "fundId")
      .addSelect(
        `COALESCE(SUM(CASE WHEN tx.type = :inType AND tx."occurredAt" < :startAt THEN tx.amount WHEN tx.type = :outType AND tx."occurredAt" < :startAt THEN -tx.amount ELSE 0 END), 0)::float`,
        "openingAmount",
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN tx.type = :inType AND tx."occurredAt" BETWEEN :startAt AND :endAt THEN tx.amount ELSE 0 END), 0)::float`,
        "inAmount",
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN tx.type = :outType AND tx."occurredAt" BETWEEN :startAt AND :endAt THEN tx.amount ELSE 0 END), 0)::float`,
        "outAmount",
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN tx.type = :inType AND tx."occurredAt" <= :endAt THEN tx.amount WHEN tx.type = :outType AND tx."occurredAt" <= :endAt THEN -tx.amount ELSE 0 END), 0)::float`,
        "closingAmount",
      )
      .where("tx.fundId IN (:...allowedFundIds)", { allowedFundIds })
      .groupBy("tx.fundId")
      .setParameters({
        inType: TransactionType.IN,
        outType: TransactionType.OUT,
        startAt,
        endAt,
      });

    const rawResults = await qb.getRawMany();

    let rows = rawResults.map((r) => ({
      ...r,
      fund: fundMap.get(r.fundId) ?? null,
    }));

    rows.sort((a, b) => {
      const aVal = Number(a[sortBy] ?? 0);
      const bVal = Number(b[sortBy] ?? 0);
      return sortOrder === "DESC" ? bVal - aVal : aVal - bVal;
    });

    const totalRecords = rows.length;
    const totalPages = Math.ceil(totalRecords / size);
    const pagedRows = rows.slice((page - 1) * size, page * size);

    const summary = rawResults.reduce(
      (acc, r) => ({
        openingAmount: acc.openingAmount + Number(r.openingAmount),
        inAmount: acc.inAmount + Number(r.inAmount),
        outAmount: acc.outAmount + Number(r.outAmount),
        closingAmount: acc.closingAmount + Number(r.closingAmount),
      }),
      { openingAmount: 0, inAmount: 0, outAmount: 0, closingAmount: 0 },
    );

    return {
      success: true,
      statusCode: 200,
      message: "Success",
      data: pagedRows,
      pagination: { currentPage: page, size, totalRecords, totalPages },
      summary,
    };
  }

  /**
   * Chi tiết giao dịch quỹ
   */
  async getDetail(params: FundBalanceDetailQueryDto): Promise<ApiResponse> {
    const {
      companyId,
      fundId,
      page = 1,
      size = 20,
      startAt,
      endAt,
      sortOrder = "DESC",
    } = params;

    const manager = await this.getManager();

    const qb = manager
      .createQueryBuilder(FundTransaction, "tx")
      .innerJoin(Fund, "fund", "fund.id = tx.fundId AND fund.deletedAt IS NULL")
      .where("fund.companyId = :companyId", { companyId })
      .orderBy("tx.occurredAt", sortOrder);

    if (fundId) {
      qb.andWhere("tx.fundId = :fundId", { fundId });
    }
    if (startAt) {
      qb.andWhere("tx.occurredAt >= :startAt", { startAt });
    }
    if (endAt) {
      qb.andWhere("tx.occurredAt <= :endAt", { endAt });
    }

    const totalRecords = await qb.getCount();
    const totalPages = Math.ceil(totalRecords / size);
    const data = await qb
      .skip((page - 1) * size)
      .take(size)
      .getMany();

    return {
      success: true,
      statusCode: 200,
      message: "Success",
      data,
      pagination: { currentPage: page, size, totalRecords, totalPages },
    };
  }
}
