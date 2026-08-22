import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { InvoiceRepository } from "./invoice.repository";
import { INVOICE_TYPES } from "./invoice.types";
import { Invoice, InvoiceSourceType } from "@/database/models/company/Invoice";
import { DeepPartial, EntityManager } from "typeorm";
import { CalculationUtil } from "@/shared/utils/calculation.util";
import { generateCode } from "@/shared/utils/code.utils";
import { PARTNER_TYPES } from "@/module/partner/partner.types";
import { PartnerRepository } from "@/module/partner/partner.repository";
import { ORDER_TYPES } from "@/module/order/order.types";
import { OrderRepository } from "@/module/order/order.repository";
import { PURCHASE_TYPES } from "@/module/purchase/purchase.types";
import { PurchaseRepository } from "@/module/purchase/purchase.repository";
import { SHIPPING_PLAN_TYPES } from "@/module/shippingPlan/shippingPlan.types";
import { ShippingPlanRepository } from "@/module/shippingPlan/shippingPlan.repository";
import { STOCK_DOCUMENT_TYPES } from "@/module/stockDocument/stockDocument.types";
import { StockDocumentRepository } from "@/module/stockDocument/stockDocument.repository";
import {
  PARTNER_DEBT_SYNC_TYPES,
  PartnerDebtSyncService,
} from "@/module/partnerDebtSync";
import { VAT_DEBT_SYNC_TYPES, VatDebtSyncService } from "@/module/vatDebtSync";
import {
  PartnerDebtRefTypeEnum,
  PartnerDebtTransaction,
} from "@/database/models/company/PartnerDebtTransaction";
import { VatTransactionTypeEnum } from "@/database/models/company/VatDebtTransaction";
import { TransactionTypeEnum } from "@/shared/constants/enum";

@injectable()
export class InvoiceService extends BaseService<Invoice> {
  protected repository: InvoiceRepository;
  protected uniqueFields: (keyof Invoice)[] = ["invoiceNumber"];
  protected uniqueScope?: (keyof Invoice)[] = ["companyId"];
  protected searchableFields = ["invoiceNumber", "note"];
  protected timeField: keyof Invoice = "invoiceDate";

  constructor(
    @inject(INVOICE_TYPES.InvoiceRepository)
    repository: InvoiceRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(ORDER_TYPES.OrderRepository)
    private orderRepository: OrderRepository,
    @inject(PURCHASE_TYPES.PurchaseRepository)
    private purchaseRepository: PurchaseRepository,
    @inject(SHIPPING_PLAN_TYPES.ShippingPlanRepository)
    private shippingPlanRepository: ShippingPlanRepository,
    @inject(STOCK_DOCUMENT_TYPES.StockDocumentRepository)
    private stockDocumentRepository: StockDocumentRepository,
    @inject(PARTNER_DEBT_SYNC_TYPES.PartnerDebtSyncService)
    private partnerDebtSync: PartnerDebtSyncService,
    @inject(VAT_DEBT_SYNC_TYPES.VatDebtSyncService)
    private vatDebtSync: VatDebtSyncService,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Invoice>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Ưu tiên stockDocument
    await this.stockDocumentRepository.attachInfo(data, manager);

    if (data.sourceType === InvoiceSourceType.DOCUMENT) {
      data.purchaseId =
        data.stockDocumentSnapshot?.purchaseId || data.purchaseId;
      data.orderId = data.stockDocumentSnapshot?.orderId || data.orderId;
    }

    await this.orderRepository.attachInfo(data, manager);
    await this.purchaseRepository.attachInfo(data, manager);
    // Nạp snapshot cho các entity liên quan (tham khảo purchase/stockDocument)
    await this.partnerRepository.attachInfo(data, manager);
    await this.shippingPlanRepository.attachInfo(data, manager);

    // Tính toán
    this.calculateInvoice(data);
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Invoice>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const existing = await this.repository.getById(id, manager);
    if (!existing) return;

    // Không cho phép update các field liên quan đến source ở zod nên không cần attachInfo nữa
    if (data.lines !== undefined) {
      this.calculateInvoice(data);
    }
  }

  async actionAfterCreate(
    data: Invoice,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.partnerDebtSync.syncForInvoice(data, manager);
    await this.vatDebtSync.syncForInvoice(data, manager);
    await this.recalculatePaidAmounts(data.id, manager);
  }

  async actionAfterUpdate(
    data: Invoice,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.partnerDebtSync.syncForInvoice(data, manager);
    await this.vatDebtSync.syncForInvoice(data, manager);
    await this.recalculatePaidAmounts(data.id, manager);
  }

  async actionAfterDelete(
    data: Invoice,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.partnerDebtSync.removeByRef(
      manager,
      PartnerDebtRefTypeEnum.INVOICE,
      data.id,
    );
    // VAT: xóa cả 2 loại (purchase/sales) theo invoiceId
    await this.vatDebtSync.removeByRef(
      manager,
      VatTransactionTypeEnum.PURCHASE_INVOICE,
      data.id,
    );
    await this.vatDebtSync.removeByRef(
      manager,
      VatTransactionTypeEnum.SALES_INVOICE,
      data.id,
    );
  }

  /**
   * Tính lại nợ đã trả (totalPaidAmount) và nợ còn lại (totalRemainingAmount)
   * của 1 hóa đơn dựa trên các phát sinh trong sổ công nợ gắn theo hóa đơn:
   *  - Đã trả  = tổng OUT (phiếu thu/chi PAYMENT, đối trừ DEBT_OFFSET)
   *  - Điều chỉnh (ADJUSTMENT): IN tăng nợ, OUT giảm nợ (không phải tiền trả)
   *  - totalRemainingAmount = totalAmount - đã trả ± điều chỉnh (>= 0)
   * Gọi lại khi có thay đổi từ hóa đơn, incomeExpense, adjustment, offset.
   */
  async recalculatePaidAmounts(
    invoiceId: string,
    manager: EntityManager,
  ): Promise<void> {
    const invoice = await this.repository.getById(invoiceId, manager);
    if (!invoice) return;

    const rows = await manager.getRepository(PartnerDebtTransaction).find({
      where: { invoiceId, deletedAt: undefined as any },
    });

    let paid = 0;
    let adjustmentNet = 0;
    for (const r of rows) {
      const amt = Number(r.amount || 0);
      if (r.type === TransactionTypeEnum.IN) {
        if (r.refType === PartnerDebtRefTypeEnum.ADJUSTMENT) {
          adjustmentNet += amt;
        }
      } else {
        if (r.refType === PartnerDebtRefTypeEnum.ADJUSTMENT) {
          adjustmentNet -= amt;
        } else {
          // PAYMENT + DEBT_OFFSET
          paid += amt;
        }
      }
    }

    const totalAmount = Number(invoice.totalAmount || 0);
    const totalPaidAmount = paid;
    const totalRemainingAmount = Math.max(
      0,
      totalAmount - paid + adjustmentNet,
    );

    await manager.getRepository(Invoice).update(invoiceId, {
      totalPaidAmount,
      totalRemainingAmount,
    });
  }

  /**
   * Tính toán hóa đơn từ các line:
   *   line.subTotal   = quantity * unitPrice
   *   line.taxAmount  = quantity * unitPrice * taxRate / 100
   *   line.totalAmount= subTotal + taxAmount
   *   invoice         = tổng các line
   */
  private calculateInvoice(data: DeepPartial<Invoice>): void {
    const lines = (data.lines || []) as any[];
    if (!lines.length) {
      data.subTotal = 0;
      data.taxAmount = 0;
      data.totalAmount = 0;
      return;
    }

    const util = new CalculationUtil();
    const total = util.calculateTotalForArray(lines);

    // Gán totalAmount cho từng dòng (grossAmount = subTotal + taxAmount)
    lines.forEach((line: any) => {
      line.totalAmount = line.grossAmount;
    });

    data.subTotal = total.subTotal;
    data.taxAmount = total.taxAmount;
    data.totalAmount = total.grossAmount;
  }
}
