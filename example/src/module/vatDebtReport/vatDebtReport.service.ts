import { injectable } from "inversify";
import { TransactionService } from "@/shared/base/TransactionService";
import { VatDebtTransaction } from "@/database/models/company/VatDebtTransaction";
import { TransactionType } from "@/shared/constants/enum";
import { ApiResponse } from "@/shared/types/interfaces";
import {
  VatDebtReportQueryDto,
  VatDebtDetailQueryDto,
} from "./vatDebtReport.validator";

@injectable()
export class VatDebtReportService extends TransactionService {
  /**
   * Báo cáo sổ công nợ VAT theo kỳ
   */
  async getReport(params: VatDebtReportQueryDto): Promise<ApiResponse> {
    const {
      companyId,
      startAt = new Date(new Date().getFullYear(), 0, 1),
      endAt = new Date(),
    } = params;

    const manager = await this.getManager();

    const qb = manager
      .createQueryBuilder(VatDebtTransaction, "tx")
      .select(
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
      .where("tx.companyId = :companyId", { companyId })
      .andWhere("tx.deletedAt IS NULL")
      .setParameters({
        inType: TransactionType.IN,
        outType: TransactionType.OUT,
        startAt,
        endAt,
      });

    const summary = await qb.getRawOne();

    return {
      success: true,
      statusCode: 200,
      message: "Success",
      data: summary,
    };
  }

  /**
   * Chi tiết giao dịch VAT
   */
  async getDetail(params: VatDebtDetailQueryDto): Promise<ApiResponse> {
    const {
      companyId,
      page = 1,
      size = 20,
      startAt,
      endAt,
      sortOrder = "DESC",
    } = params;

    const manager = await this.getManager();

    const qb = manager
      .createQueryBuilder(VatDebtTransaction, "tx")
      .where("tx.companyId = :companyId", { companyId })
      .andWhere("tx.deletedAt IS NULL")
      .orderBy("tx.occurredAt", sortOrder);

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
