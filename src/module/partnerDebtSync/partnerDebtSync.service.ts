import { injectable } from "inversify";
import { EntityManager } from "typeorm";
import {
  PartnerDebtRefTypeEnum,
  PartnerDebtSideEnum,
  PartnerDebtTransaction,
} from "@/database/models/PartnerDebtTransaction";
import {
  Invoice,
  InvoiceStatus,
  InvoiceType,
} from "@/database/models/company/Invoice";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { InvoiceAllocation } from "@/database/models/company/InvoiceAllocation";
import { PartnerDebtOffset } from "@/database/models/PartnerDebtOffset";
import { PartnerDebtOffsetLine } from "@/database/models/PartnerDebtOffsetLine";
import { PartnerDebtAdjustment } from "@/database/models/PartnerDebtAdjustment";
import { TransactionType } from "@/shared/constants/enum";
import DatabaseConfig from "@/config/database";

/**
 * Ghi các phát sinh công nợ (idempotent: DELETE theo (refType, refId) rồi INSERT lại).
 *
 * Nguồn phát sinh công nợ (theo thiết kế mới):
 *  - Tăng: Invoice (totalAmount) — hóa đơn đầu vào → PAYABLE, đầu ra → RECEIVABLE
 *  - Giảm: IncomeExpense phân bổ theo hóa đơn (InvoiceAllocation)
 *  - Giảm: PartnerDebtOffset (từng hóa đơn 2 phía)
 *  - Tăng/Giảm: PartnerDebtAdjustment (theo hóa đơn hoặc tổng)
 */
@injectable()
export class PartnerDebtSyncService {
  private async deleteByRef(
    manager: EntityManager,
    refType: PartnerDebtRefTypeEnum,
    refId: string,
  ): Promise<void> {
    await manager
      .getRepository(PartnerDebtTransaction)
      .createQueryBuilder()
      .delete()
      .where("refType = :refType AND refId = :refId", { refType, refId })
      .execute();
  }

  /** Xóa toàn bộ phát sinh công nợ theo nguồn (dùng khi xóa nguồn gốc). */
  async removeByRef(
    manager: EntityManager,
    refType: PartnerDebtRefTypeEnum,
    refId: string,
  ): Promise<void> {
    await this.deleteByRef(manager, refType, refId);
  }

  private async insertMany(
    manager: EntityManager,
    rows: Partial<PartnerDebtTransaction>[],
  ): Promise<void> {
    if (!rows.length) return;
    const repo = manager.getRepository(PartnerDebtTransaction);
    // lần lượt giữ thứ tự occurredAt (save giữ nguyên thứ tự)
    await repo.save(rows as PartnerDebtTransaction[]);
  }

  /** Số dư công nợ của 1 đối tác tới thời điểm atDate (IN +, OUT -), theo side. */
  async getDebtAtDate(
    partnerId: string,
    atDate: Date,
    manager?: EntityManager,
  ): Promise<{ payableDebtAmount: number; receivableDebtAmount: number }> {
    const m = manager || DatabaseConfig.manager;
    const rows = await m
      .createQueryBuilder(PartnerDebtTransaction, "tx")
      .select("tx.side", "side")
      .addSelect(
        `COALESCE(SUM(CASE WHEN tx.type = :inType THEN tx.amount ELSE -tx.amount END),0)::float`,
        "balance",
      )
      .where("tx.partnerId = :partnerId", { partnerId })
      .andWhere("tx.occurredAt <= :atDate", { atDate })
      .andWhere("tx.deletedAt IS NULL")
      .setParameters({ inType: TransactionType.IN })
      .groupBy("tx.side")
      .getRawMany<{ side: PartnerDebtSideEnum; balance: string }>();

    const payable = rows.find((r) => r.side === PartnerDebtSideEnum.PAYABLE);
    const receivable = rows.find(
      (r) => r.side === PartnerDebtSideEnum.RECEIVABLE,
    );
    return {
      payableDebtAmount: Number(payable?.balance || 0),
      receivableDebtAmount: Number(receivable?.balance || 0),
    };
  }

  /**
   * Đồng bộ công nợ từ hóa đơn (INCREASE).
   * Hóa đơn đầu vào (purchase)  → PAYABLE IN
   * Hóa đơn đầu ra (sales)      → RECEIVABLE IN
   */
  async syncForInvoice(data: Invoice, manager: EntityManager): Promise<void> {
    const refType = PartnerDebtRefTypeEnum.INVOICE;
    await this.deleteByRef(manager, refType, data.id);

    // Không ghi khi hóa đơn hủy, thiếu đối tác hoặc không có giá trị
    if (
      data.status === InvoiceStatus.CANCELED ||
      !data.partnerId ||
      Number(data.totalAmount || 0) <= 0
    ) {
      return;
    }

    const side =
      data.type === InvoiceType.INPUT
        ? PartnerDebtSideEnum.PAYABLE
        : PartnerDebtSideEnum.RECEIVABLE;

    await this.insertMany(manager, [
      {
        companyId: data.companyId,
        occurredAt: data.invoiceDate,
        partnerId: data.partnerId,
        invoiceId: data.id,
        side,
        type: TransactionType.IN,
        amount: Number(data.totalAmount),
        refType,
        refId: data.id,
        refCode: data.invoiceNumber,
      },
    ]);
  }

  /**
   * Đồng bộ giảm công nợ từ phiếu thu/chi theo phân bổ hóa đơn (InvoiceAllocation).
   * Mỗi allocation → 1 DECREASE (OUT) cho hóa đơn của nó.
   */
  async syncForIncomeExpense(
    data: IncomeExpense,
    allocations: InvoiceAllocation[],
    manager: EntityManager,
  ): Promise<void> {
    const refType = PartnerDebtRefTypeEnum.PAYMENT;
    await this.deleteByRef(manager, refType, data.id);

    if (!allocations?.length) return;

    const rows: Partial<PartnerDebtTransaction>[] = [];
    for (const al of allocations) {
      if (!al.invoiceId || Number(al.amount || 0) <= 0) continue;
      const invoiceType = al.invoiceSnapshot?.type;
      const side =
        invoiceType === InvoiceType.INPUT
          ? PartnerDebtSideEnum.PAYABLE
          : PartnerDebtSideEnum.RECEIVABLE;
      rows.push({
        companyId: data.companyId,
        occurredAt: data.occurredAt,
        partnerId: data.partnerId!,
        invoiceId: al.invoiceId,
        side,
        type: TransactionType.OUT,
        amount: Number(al.amount),
        refType,
        refId: data.id,
        refCode: data.code,
      });
    }
    await this.insertMany(manager, rows);
  }

  /**
   * Đồng bộ đối trừ theo từng hóa đơn: mỗi dòng → 1 DECREASE (OUT) cho side tương ứng.
   */
  async syncForOffset(
    data: PartnerDebtOffset,
    lines: PartnerDebtOffsetLine[],
    manager: EntityManager,
  ): Promise<void> {
    const refType = PartnerDebtRefTypeEnum.DEBT_OFFSET;
    await this.deleteByRef(manager, refType, data.id);

    if (!lines?.length) return;

    const rows: Partial<PartnerDebtTransaction>[] = [];
    for (const line of lines) {
      rows.push({
        companyId: data.companyId,
        occurredAt: data.occurredAt,
        partnerId: data.partnerId,
        invoiceId: line.invoiceId,
        side: line.side as unknown as PartnerDebtSideEnum,
        type: TransactionType.OUT,
        amount: Number(line.amount),
        refType,
        refId: data.id,
        refCode: data.code,
      });
    }
    await this.insertMany(manager, rows);
  }

  /**
   * Đồng bộ điều chỉnh công nợ (theo hóa đơn nếu có invoiceId, ngược lại theo tổng).
   */
  async syncForAdjustment(
    data: PartnerDebtAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    const refType = PartnerDebtRefTypeEnum.ADJUSTMENT;
    await this.deleteByRef(manager, refType, data.id);

    if (Number(data.deltaAmount || 0) <= 0) return;

    await this.insertMany(manager, [
      {
        companyId: data.companyId,
        occurredAt: data.occurredAt,
        partnerId: data.partnerId,
        invoiceId: data.invoiceId || null,
        side: data.side,
        type: data.type,
        amount: Number(data.deltaAmount),
        refType,
        refId: data.id,
        refCode: data.code,
      },
    ]);
  }
}
