import { injectable } from "inversify";
import { TransactionService } from "@/shared/base/TransactionService";
import { CommissionDebtTransaction } from "@/database/models/company/CommissionDebtTransaction";
import { PartnerContact } from "@/database/models/company/PartnerContact";
import { Partner } from "@/database/models/company/Partner";
import { TransactionType } from "@/shared/constants/enum";
import { ApiResponse } from "@/shared/types/interfaces";
import {
  CommissionDebtReportQueryDto,
  CommissionDebtDetailQueryDto,
} from "./commissionDebtReport.validator";

@injectable()
export class CommissionDebtReportService extends TransactionService {
  /**
   * Báo cáo sổ công nợ hoa hồng theo kỳ
   */
  async getReport(params: CommissionDebtReportQueryDto): Promise<ApiResponse> {
    const {
      companyId,
      page = 1,
      size = 20,
      partnerContactIds,
      startAt = new Date(new Date().getFullYear(), 0, 1),
      endAt = new Date(),
      sortBy = "closingAmount",
      sortOrder = "DESC",
    } = params;

    const manager = await this.getManager();

    // Get partner contacts for this company
    const contactsQb = manager
      .createQueryBuilder(PartnerContact, "pc")
      .innerJoin(Partner, "p", "p.id = pc.partnerId AND p.deletedAt IS NULL")
      .where("p.companyId = :companyId", { companyId })
      .andWhere("pc.deletedAt IS NULL");

    if (this.checkArrayFilter(partnerContactIds)) {
      contactsQb.andWhere("pc.id IN (:...partnerContactIds)", {
        partnerContactIds,
      });
    }

    const filteredContacts = await contactsQb.getMany();
    if (!filteredContacts.length) {
      return {
        success: true,
        statusCode: 200,
        message: "No partner contacts found.",
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

    const allowedContactIds = filteredContacts.map((c) => c.id);
    const contactMap = new Map(filteredContacts.map((c) => [c.id, c]));

    const qb = manager
      .createQueryBuilder(CommissionDebtTransaction, "tx")
      .select("tx.partnerContactId", "partnerContactId")
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
      .where("tx.partnerContactId IN (:...allowedContactIds)", {
        allowedContactIds,
      })
      .andWhere("tx.deletedAt IS NULL")
      .groupBy("tx.partnerContactId")
      .setParameters({
        inType: TransactionType.IN,
        outType: TransactionType.OUT,
        startAt,
        endAt,
      });

    const rawResults = await qb.getRawMany();

    let rows = rawResults.map((r) => ({
      ...r,
      partnerContact: contactMap.get(r.partnerContactId) ?? null,
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
      {
        openingAmount: 0,
        inAmount: 0,
        outAmount: 0,
        closingAmount: 0,
      },
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
   * Chi tiết giao dịch công nợ hoa hồng
   */
  async getDetail(params: CommissionDebtDetailQueryDto): Promise<ApiResponse> {
    const {
      companyId,
      partnerContactId,
      page = 1,
      size = 20,
      startAt,
      endAt,
      sortOrder = "DESC",
    } = params;

    const manager = await this.getManager();

    const qb = manager
      .createQueryBuilder(CommissionDebtTransaction, "tx")
      .innerJoin(PartnerContact, "pc", "pc.id = tx.partnerContactId")
      .innerJoin(Partner, "p", "p.id = pc.partnerId AND p.deletedAt IS NULL")
      .where("p.companyId = :companyId", { companyId })
      .andWhere("tx.deletedAt IS NULL")
      .orderBy("tx.occurredAt", sortOrder);

    if (partnerContactId) {
      qb.andWhere("tx.partnerContactId = :partnerContactId", {
        partnerContactId,
      });
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
