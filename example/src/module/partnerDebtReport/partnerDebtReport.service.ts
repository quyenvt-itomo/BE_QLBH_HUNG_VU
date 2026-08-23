import { injectable } from "inversify";
import { Brackets, EntityManager, In, MoreThan } from "typeorm";
import { TransactionService } from "@/shared/base/TransactionService";
import { DebtTransaction } from "@/database/models/company/DebtTransaction";
import { Partner } from "@/database/models/company/Partner";
import {
  Invoice,
  InvoiceStatus,
  InvoiceType,
} from "@/database/models/company/Invoice";
import { PaymentTerm } from "@/database/models/company/PaymentTerm";
import { TransactionType } from "@/shared/constants/enum";
import { ApiResponse } from "@/shared/types/interfaces";
import {
  PartnerDebtReportQueryDto,
  PartnerDebtDetailQueryDto,
  PartnerDebtListQueryDto,
  PartnerDebtInvoiceListQueryDto,
} from "./partnerDebtReport.validator";

@injectable()
export class PartnerDebtReportService extends TransactionService {
  /**
   * Báo cáo sổ công nợ đối tác theo kỳ: opening / tăng / giảm / closing
   */
  async getReport(params: PartnerDebtReportQueryDto): Promise<ApiResponse> {
    const {
      storeId,
      keyword,
      page = 1,
      size = 20,
      side,
      partnerIds,
      partnerGroupIds,
      startAt = new Date(new Date().getFullYear(), 0, 1),
      endAt = new Date(),
      sortBy = "closingAmount",
      sortOrder = "DESC",
    } = params;

    const manager = await this.getManager();

    // Filter partners by storeId and optional keyword
    const partnersQb = manager
      .createQueryBuilder(Partner, "partner")
      .where("partner.storeId = :storeId", { storeId })
      .andWhere("partner.deletedAt IS NULL")
      // Lấy thêm group
      .leftJoinAndSelect("partner.group", "group");

    if (keyword) {
      partnersQb.andWhere(
        new Brackets((qb) => {
          qb.where("partner.name ILIKE :kw", { kw: `%${keyword}%` }).orWhere(
            "partner.code ILIKE :kw",
            { kw: `%${keyword}%` },
          );
        }),
      );
    }
    if (this.checkArrayFilter(partnerIds)) {
      partnersQb.andWhere("partner.id IN (:...partnerIds)", { partnerIds });
    }

    const filteredPartners = await partnersQb.getMany();
    if (!filteredPartners.length) {
      return {
        success: true,
        statusCode: 200,
        message: "No partners found.",
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

    const allowedPartnerIds = filteredPartners.map((p) => p.id);
    const partnerMap = new Map(filteredPartners.map((p) => [p.id, p]));

    const qb = manager
      .createQueryBuilder(DebtTransaction, "tx")
      .select("tx.partnerId", "partnerId")
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
      .where("tx.partnerId IN (:...allowedPartnerIds)", { allowedPartnerIds })
      .andWhere("tx.deletedAt IS NULL")
      .groupBy("tx.partnerId")
      .setParameters({
        inType: TransactionType.IN,
        outType: TransactionType.OUT,
        startAt,
        endAt,
      });

    if (side) {
      qb.andWhere("tx.side = :side", { side });
    }

    const rawResults = await qb.getRawMany();

    // Map: mỗi row là Partner được extend thêm các trường tổng hợp (giống inventory extend product)
    let rows = rawResults
      .map((r) => {
        const partner = partnerMap.get(r.partnerId) ?? null;
        if (!partner) return null;
        return {
          ...partner,
          openingAmount: Number(r.openingAmount) || 0,
          inAmount: Number(r.inAmount) || 0,
          outAmount: Number(r.outAmount) || 0,
          closingAmount: Number(r.closingAmount) || 0,
        };
      })
      .filter(Boolean) as any[];

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
   * Chi tiết giao dịch công nợ đối tác.
   * Mỗi transaction kèm `closingAmount` = dư nợ của đối tác sau giao dịch đó
   * (running balance: IN +, OUT -), tính riêng theo từng side.
   */
  async getDetail(params: PartnerDebtDetailQueryDto): Promise<ApiResponse> {
    const {
      storeId,
      partnerId,
      side,
      page = 1,
      size = 20,
      startAt,
      endAt,
    } = params;

    const manager = await this.getManager();

    const effectiveStartAt = startAt || new Date(0);
    const effectiveEndAt = endAt || new Date();

    // 1) Dư nợ đầu kỳ (trước startAt) theo (partnerId, side)
    const openingQb = manager
      .createQueryBuilder(DebtTransaction, "tx")
      .select("tx.partnerId", "partnerId")
      .addSelect("tx.side", "side")
      .addSelect(
        `COALESCE(SUM(CASE WHEN tx.type = :inType THEN tx.amount ELSE -tx.amount END), 0)::float`,
        "openingAmount",
      )
      .innerJoin(
        Partner,
        "partner",
        "partner.id = tx.partnerId AND partner.deletedAt IS NULL",
      )
      .where("partner.storeId = :storeId", { storeId })
      .andWhere("tx.deletedAt IS NULL")
      .andWhere("tx.occurredAt < :startAt", { startAt: effectiveStartAt })
      .setParameters({ inType: TransactionType.IN })
      .groupBy("tx.partnerId")
      .addGroupBy("tx.side");
    if (partnerId)
      openingQb.andWhere("tx.partnerId = :partnerId", { partnerId });
    if (side) openingQb.andWhere("tx.side = :side", { side });

    const openingRows = await openingQb.getRawMany<{
      partnerId: string;
      side: string;
      openingAmount: string;
    }>();
    const openingByKey = new Map<string, number>();
    for (const r of openingRows) {
      openingByKey.set(
        `${r.partnerId}|${r.side}`,
        Number(r.openingAmount) || 0,
      );
    }

    // 2) Tất cả transactions trong kỳ, sắp ASC để tính dư nợ chạy
    const qb = manager
      .createQueryBuilder(DebtTransaction, "tx")
      .leftJoin(
        Partner,
        "partner",
        "partner.id = tx.partnerId AND partner.deletedAt IS NULL",
      )
      .where("partner.storeId = :storeId", { storeId })
      .andWhere("tx.deletedAt IS NULL")
      .andWhere("tx.occurredAt BETWEEN :startAt AND :endAt", {
        startAt: effectiveStartAt,
        endAt: effectiveEndAt,
      })
      .orderBy("tx.occurredAt", "ASC")
      .addOrderBy("tx.createdAt", "ASC")
      .addOrderBy("tx.id", "ASC");
    if (partnerId) qb.andWhere("tx.partnerId = :partnerId", { partnerId });
    if (side) qb.andWhere("tx.side = :side", { side });

    const allTransactions = await qb.getMany();

    // 3) Gắn closingAmount (dư nợ sau giao dịch), tính riêng theo side
    const running = new Map<string, number>();
    for (const tx of allTransactions) {
      const key = `${tx.partnerId}|${tx.side}`;
      if (!running.has(key)) running.set(key, openingByKey.get(key) || 0);
      const sign = tx.type === TransactionType.IN ? 1 : -1;
      running.set(key, running.get(key)! + sign * Number(tx.amount));
      (tx as any).closingAmount = running.get(key)!;
    }

    // 4) Paginate
    const totalRecords = allTransactions.length;
    const totalPages = Math.ceil(totalRecords / size) || 1;
    const currentPage = Math.min(page, totalPages) || 1;
    const data = allTransactions.slice(
      (currentPage - 1) * size,
      currentPage * size,
    );

    // 5) Summary (cùng scope: storeId, partnerId?, side?)
    const summaryQb = manager
      .createQueryBuilder(DebtTransaction, "tx")
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
      .addSelect(`COUNT(*)::int`, "transactionCount")
      .innerJoin(
        Partner,
        "partner",
        "partner.id = tx.partnerId AND partner.deletedAt IS NULL",
      )
      .where("partner.storeId = :storeId", { storeId })
      .andWhere("tx.deletedAt IS NULL")
      .andWhere("tx.occurredAt <= :endAt", { endAt: effectiveEndAt })
      .setParameters({
        inType: TransactionType.IN,
        outType: TransactionType.OUT,
        startAt: effectiveStartAt,
        endAt: effectiveEndAt,
      });
    if (partnerId)
      summaryQb.andWhere("tx.partnerId = :partnerId", { partnerId });
    if (side) summaryQb.andWhere("tx.side = :side", { side });

    const summary = await summaryQb.getRawOne();

    return {
      success: true,
      statusCode: 200,
      message: "Success",
      data,
      pagination: { currentPage, size, totalRecords, totalPages },
      summary,
    };
  }

  /**
   * Nợ hiện tại theo hóa đơn — danh sách đối tác kèm nợ của họ.
   * Bắt buộc truyền invoiceType (input | output). Không lọc theo thời gian.
   * Mỗi đối tác trả về: totalDebt, totalNotDue, totalOverdue,
   * under30Days, under60Days, under90Days, over90Days.
   * Đảm bảo: totalDebt = totalNotDue + totalOverdue =
   *          under30Days + under60Days + under90Days + over90Days.
   * Tính từ các hóa đơn còn nợ: status != PAID && totalRemainingAmount > 0,
   * dựa trên invoiceDate + PaymentTerm.maxDebtDays (mặc định 30).
   */
  async getPartnersWithDebt(
    params: PartnerDebtListQueryDto,
  ): Promise<ApiResponse> {
    const {
      storeId,
      invoiceType,
      keyword,
      partnerIds,
      page = 1,
      size = 20,
      sortBy = "totalDebt",
      sortOrder = "DESC",
    } = params;

    const manager = await this.getManager();
    const asOf = new Date();

    // 1) Filter partners
    const partners = await this.getFilteredPartners(
      manager,
      storeId,
      keyword,
      partnerIds,
    );
    if (!partners.length) {
      return {
        success: true,
        statusCode: 200,
        message: "Success",
        data: [],
        pagination: { currentPage: 1, size, totalRecords: 0, totalPages: 0 },
        summary: {
          totalDebt: 0,
          totalNotDue: 0,
          totalOverdue: 0,
          under30Days: 0,
          under60Days: 0,
          under90Days: 0,
          over90Days: 0,
        },
      };
    }

    const partnerIdList = partners.map((p) => p.id);
    const maxDebtDaysByPartner = await this.getMaxDebtDaysByPartner(
      manager,
      partnerIdList,
    );

    // 2) Load hóa đơn còn nợ của các đối tác (chỉ theo invoiceType)
    const invQb = manager
      .createQueryBuilder(Invoice, "inv")
      .select([
        "inv.id",
        "inv.partnerId",
        "inv.invoiceDate",
        "inv.totalRemainingAmount",
      ])
      .where("inv.storeId = :storeId", { storeId })
      .andWhere("inv.partnerId IN (:...partnerIds)", {
        partnerIds: partnerIdList,
      })
      .andWhere("inv.type = :invoiceType", { invoiceType })
      .andWhere("inv.status NOT IN (:...closedStatus)", {
        closedStatus: [InvoiceStatus.PAID, InvoiceStatus.CANCELED],
      })
      .andWhere("inv.deletedAt IS NULL")
      .andWhere("inv.totalRemainingAmount > 0");
    const invoices = await invQb.getMany();

    // 3) Phân loại theo từng hóa đơn
    const buckets = new Map<string, any>();
    for (const inv of invoices) {
      const partnerId = inv.partnerId;
      if (!partnerId) continue;
      const remaining = Number(inv.totalRemainingAmount || 0);
      if (remaining <= 0) continue;

      if (!buckets.has(partnerId)) buckets.set(partnerId, this.emptyBucket());
      const bucket = buckets.get(partnerId);

      const maxDebtDays =
        maxDebtDaysByPartner.get(partnerId)?.maxDebtDays ?? 30;
      const invoiceDate = new Date(inv.invoiceDate);
      const ageDays = Math.floor(
        (asOf.getTime() - invoiceDate.getTime()) / 86400000,
      );
      const dueAt = new Date(invoiceDate.getTime() + maxDebtDays * 86400000);

      bucket.totalDebt += remaining;
      bucket.invoiceCount += 1;
      if (asOf > dueAt) bucket.totalOverdue += remaining;
      else bucket.totalNotDue += remaining;

      if (ageDays < 30) bucket.under30Days += remaining;
      else if (ageDays < 60) bucket.under60Days += remaining;
      else if (ageDays < 90) bucket.under90Days += remaining;
      else bucket.over90Days += remaining;
    }

    // 4) Merge partner + bucket
    let rows = partners
      .map((p) => ({
        ...p,
        ...(buckets.get(p.id) || this.emptyBucket()),
      }))
      // Chỉ giữ các đối tác có nợ
      .filter((r) => r.totalDebt > 0);

    rows.sort((a, b) => {
      const av = sortBy === "name" ? a.name : Number(a[sortBy] ?? 0);
      const bv = sortBy === "name" ? b.name : Number(b[sortBy] ?? 0);
      return sortOrder === "DESC"
        ? (bv as any) - (av as any)
        : (av as any) - (bv as any);
    });

    // 5) Paginate
    const totalRecords = rows.length;
    const totalPages = Math.ceil(totalRecords / size) || 1;
    const pagedRows = rows.slice((page - 1) * size, page * size);

    // 6) Summary
    const summary = rows.reduce(
      (acc, r) => ({
        totalDebt: acc.totalDebt + r.totalDebt,
        totalNotDue: acc.totalNotDue + r.totalNotDue,
        totalOverdue: acc.totalOverdue + r.totalOverdue,
        under30Days: acc.under30Days + r.under30Days,
        under60Days: acc.under60Days + r.under60Days,
        under90Days: acc.under90Days + r.under90Days,
        over90Days: acc.over90Days + r.over90Days,
      }),
      {
        totalDebt: 0,
        totalNotDue: 0,
        totalOverdue: 0,
        under30Days: 0,
        under60Days: 0,
        under90Days: 0,
        over90Days: 0,
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
   * Chi tiết nợ theo hóa đơn của 1 đối tác (invoiceType + partnerId):
   * danh sách các hóa đơn còn nợ kèm allocations + các bút toán
   * giảm trừ (đối trừ debt_offset, điều chỉnh adjustment) của từng hóa đơn.
   */
  async getPartnerInvoices(
    params: PartnerDebtInvoiceListQueryDto,
  ): Promise<ApiResponse> {
    const { storeId, invoiceType, partnerId, page = 1, size = 20 } = params;
    const manager = await this.getManager();

    const countWhere = {
      storeId,
      partnerId,
      type: invoiceType,
      status: In([InvoiceStatus.EFFECTIVE, InvoiceStatus.PARTIALLY_PAID]),
      deletedAt: undefined as any,
    } as any;
    countWhere.totalRemainingAmount = MoreThan(0);

    const totalRecords = await manager
      .getRepository(Invoice)
      .count({ where: countWhere });
    const totalPages = Math.ceil(totalRecords / size) || 1;

    const invoices = await manager.getRepository(Invoice).find({
      where: countWhere,
      relations: { allocations: true },
      order: { invoiceDate: "ASC" },
      skip: (page - 1) * size,
      take: size,
    });

    // Load các bút toán giảm trừ gắn theo từng hóa đơn (đối trừ / điều chỉnh / thu chi)
    const invoiceIds = invoices.map((i) => i.id);
    const txByInvoice = new Map<string, DebtTransaction[]>();
    if (invoiceIds.length) {
      const txs = await manager.getRepository(DebtTransaction).find({
        where: { invoiceId: In(invoiceIds), deletedAt: undefined as any },
      });
      for (const t of txs) {
        if (!t.invoiceId) continue;
        if (!txByInvoice.has(t.invoiceId)) txByInvoice.set(t.invoiceId, []);
        txByInvoice.get(t.invoiceId)!.push(t);
      }
    }

    const data = invoices.map((inv) => ({
      ...inv,
      allocations: inv.allocations || [],
      reductions: txByInvoice.get(inv.id) || [],
    }));

    return {
      success: true,
      statusCode: 200,
      message: "Success",
      data,
      pagination: {
        currentPage: page,
        size,
        totalRecords,
        totalPages,
      },
    };
  }

  // ================================================================
  //  Helpers
  // ================================================================
  private async getFilteredPartners(
    manager: EntityManager,
    storeId: string,
    keyword?: string,
    partnerIds?: string[],
  ): Promise<Partner[]> {
    const qb = manager
      .createQueryBuilder(Partner, "partner")
      .where("partner.storeId = :storeId", { storeId })
      .andWhere("partner.deletedAt IS NULL")
      .leftJoinAndSelect("partner.group", "group"); // Lấy thêm group
    if (keyword) {
      qb.andWhere(
        new Brackets((b) => {
          b.where("partner.name ILIKE :kw", { kw: `%${keyword}%` }).orWhere(
            "partner.code ILIKE :kw",
            { kw: `%${keyword}%` },
          );
        }),
      );
    }
    if (this.checkArrayFilter(partnerIds)) {
      qb.andWhere("partner.id IN (:...partnerIds)", { partnerIds });
    }
    return await qb.getMany();
  }

  private async getMaxDebtDaysByPartner(
    manager: EntityManager,
    partnerIds: string[],
  ): Promise<
    Map<string, { id: string | null; name: string | null; maxDebtDays: number }>
  > {
    const rows = await manager
      .createQueryBuilder(Partner, "partner")
      .leftJoin(PaymentTerm, "pt", "pt.id = partner.paymentTermId")
      .select("partner.id", "partnerId")
      .addSelect("pt.id", "paymentTermId")
      .addSelect("pt.name", "paymentTermName")
      .addSelect("COALESCE(pt.maxDebtDays, 30)", "maxDebtDays")
      .where("partner.id IN (:...partnerIds)", { partnerIds })
      .addGroupBy("partner.id")
      .addGroupBy("pt.id")
      .addGroupBy("pt.name")
      .getRawMany<{
        partnerId: string;
        paymentTermId: string | null;
        paymentTermName: string | null;
        maxDebtDays: string;
      }>();

    const map = new Map<
      string,
      { id: string | null; name: string | null; maxDebtDays: number }
    >();
    for (const r of rows) {
      map.set(r.partnerId, {
        id: r.paymentTermId,
        name: r.paymentTermName,
        maxDebtDays: Number(r.maxDebtDays) || 30,
      });
    }
    return map;
  }

  private emptyBucket() {
    return {
      totalDebt: 0,
      totalNotDue: 0,
      totalOverdue: 0,
      under30Days: 0,
      under60Days: 0,
      under90Days: 0,
      over90Days: 0,
      invoiceCount: 0,
    };
  }
}
