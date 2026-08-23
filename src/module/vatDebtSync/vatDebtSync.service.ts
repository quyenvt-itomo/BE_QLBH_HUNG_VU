import { injectable } from "inversify";
import { EntityManager } from "typeorm";
import {
  VatDebtTransaction,
  VatTransactionType,
} from "@/database/models/VatTransaction";
import {
  Invoice,
  InvoiceStatus,
  InvoiceType,
} from "@/database/models/company/Invoice";
import {
  IncomeExpense,
  IncomeExpenseTypeEnum,
} from "@/database/models/store/IncomeExpense";
import { VatDebtAdjustment } from "@/database/models/VatDebtAdjustment";
import { TransactionType } from "@/shared/constants/enum";
import DatabaseConfig from "@/config/database";

/**
 * Ghi các phát sinh VAT (số dư thuế của doanh nghiệp), idempotent theo (refType, refId).
 *
 * Quy ước (theo mô tả nghiệp vụ):
 *  - Tăng:  hóa đơn đầu vào (purchase) — VAT phải nộp tăng: type IN, amount = taxAmount
 *  - Giảm:  hóa đơn đầu ra (sales)     — VAT đầu ra giảm số dư phải nộp: type OUT, amount = taxAmount
 *  - Tăng:  nộp tiền thuế (incomeExpense expense, isVatPayment): type IN
 *  - Tăng/Giảm: VatDebtAdjustment (điều chỉnh đầu/cuối kỳ)
 */
@injectable()
export class VatDebtSyncService {
  private async deleteByRef(
    manager: EntityManager,
    refType: VatTransactionType,
    refId: string,
  ): Promise<void> {
    await manager
      .getRepository(VatDebtTransaction)
      .createQueryBuilder()
      .delete()
      .where("refType = :refType AND refId = :refId", { refType, refId })
      .execute();
  }

  /** Xóa toàn bộ phát sinh VAT theo nguồn (dùng khi xóa nguồn gốc). */
  async removeByRef(
    manager: EntityManager,
    refType: VatTransactionType,
    refId: string,
  ): Promise<void> {
    await this.deleteByRef(manager, refType, refId);
  }

  private async insertMany(
    manager: EntityManager,
    rows: Partial<VatDebtTransaction>[],
  ): Promise<void> {
    if (!rows.length) return;
    await manager
      .getRepository(VatDebtTransaction)
      .save(rows as VatDebtTransaction[]);
  }

  /** Số dư VAT hiện tại (tới thời điểm) dùng để tính countedAmount cho điều chỉnh. */
  async getBalanceAtDate(
    companyId: string,
    atDate: Date,
    manager?: EntityManager,
  ): Promise<number> {
    const m = manager || DatabaseConfig.manager;
    const row = await m
      .createQueryBuilder(VatDebtTransaction, "tx")
      .select(
        `COALESCE(SUM(CASE WHEN tx.type = :inType THEN tx.amount ELSE -tx.amount END),0)::float`,
        "balance",
      )
      .where("tx.companyId = :companyId", { companyId })
      .andWhere("tx.occurredAt <= :atDate", { atDate })
      .andWhere("tx.deletedAt IS NULL")
      .setParameters({ inType: TransactionType.IN })
      .getRawOne<{ balance: string }>();
    return Number(row?.balance || 0);
  }

  /** Đồng bộ VAT từ hóa đơn. */
  async syncForInvoice(data: Invoice, manager: EntityManager): Promise<void> {
    const refType =
      data.type === InvoiceType.INPUT
        ? VatTransactionType.PURCHASE_INVOICE
        : VatTransactionType.SALES_INVOICE;
    await this.deleteByRef(manager, refType, data.id);

    if (
      data.status === InvoiceStatus.CANCELED ||
      Number(data.taxAmount || 0) === 0
    ) {
      return;
    }

    const type =
      data.type === InvoiceType.INPUT
        ? TransactionType.IN
        : TransactionType.OUT;

    await this.insertMany(manager, [
      {
        companyId: data.companyId,
        occurredAt: data.invoiceDate,
        type,
        amount: Number(data.taxAmount),
        refType,
        refId: data.id,
        refCode: data.invoiceNumber,
      },
    ]);
  }

  /** Đồng bộ VAT từ phiếu nộp thuế (incomeExpense, isVatPayment = true, type = expense) → tăng số dư. */
  async syncForIncomeExpense(
    data: IncomeExpense,
    manager: EntityManager,
  ): Promise<void> {
    const refType = VatTransactionType.EXPENSE;
    await this.deleteByRef(manager, refType, data.id);

    const isVatPayment =
      data.isVatPayment && data.type === IncomeExpenseTypeEnum.EXPENSE;
    if (!isVatPayment || Number(data.amount || 0) <= 0) return;

    await this.insertMany(manager, [
      {
        companyId: data.companyId,
        occurredAt: data.occurredAt,
        type: TransactionType.IN,
        amount: Number(data.amount),
        refType,
        refId: data.id,
        refCode: data.code,
      },
    ]);
  }

  /** Đồng bộ điều chỉnh VAT (tăng/giảm số dư). */
  async syncForAdjustment(
    data: VatDebtAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    const refType = VatTransactionType.ADJUSTMENT;
    await this.deleteByRef(manager, refType, data.id);

    if (Number(data.deltaAmount || 0) <= 0) return;

    await this.insertMany(manager, [
      {
        companyId: data.companyId,
        occurredAt: data.occurredAt,
        type: data.type,
        amount: Number(data.deltaAmount),
        refType,
        refId: data.id,
        refCode: data.code,
      },
    ]);
  }
}
