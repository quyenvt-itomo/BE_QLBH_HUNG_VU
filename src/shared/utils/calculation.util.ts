export type CalculateData = {
  quantity?: number;
  unitPrice?: number;
  taxRate?: number;
  commissionRate?: number;
  [key: string]: any;
};

export type DocumentCalculationOptions = {
  discountType?: "amount" | "percent";
  discountValue?: number;
  taxType?: "amount" | "percent";
  taxValue?: number;
};

type CalculateTotal = {
  quantity: number;
  subTotal: number;
  taxAmount: number;
  grossAmount: number;
};

type PurchaseTotal = CalculateTotal & {
  totalCommissionAmount: number;
  discountAmount: number;
};

export type DocumentTotal = PurchaseTotal & {
  taxType: "amount" | "percent";
  taxValue: number;
};

export class CalculationUtil {
  // =========================
  // Individual
  // =========================

  calculateSubTotal(data: CalculateData): number {
    const { quantity = 0, unitPrice = 0 } = data;
    return quantity * unitPrice;
  }

  calculateTaxAmount(data: CalculateData): number {
    const { quantity = 0, unitPrice = 0, taxRate = 0 } = data;
    return (quantity * unitPrice * taxRate) / 100;
  }

  calculateGrossAmount(data: CalculateData): number {
    return this.calculateSubTotal(data) + this.calculateTaxAmount(data);
  }

  /** Hoa hồng mua hàng = subTotal * commissionRate% */
  calculateCommissionAmount(data: CalculateData): number {
    const { quantity = 0, unitPrice = 0, commissionRate = 0 } = data;
    return (quantity * unitPrice * commissionRate) / 100;
  }

  // =========================
  // Calculate line (mutates data)
  // =========================

  /** Tính toán 1 dòng: subTotal, taxAmount, grossAmount, commissionAmount */
  calculateLine(data: CalculateData): CalculateData {
    const subTotal = this.calculateSubTotal(data);
    const taxAmount = this.calculateTaxAmount(data);
    const commissionAmount = this.calculateCommissionAmount(data);

    data.subTotal = subTotal;
    data.taxAmount = taxAmount;
    data.grossAmount = subTotal + taxAmount;
    data.commissionAmount = commissionAmount;

    return data;
  }

  // =========================
  // Calculate totals for array
  // =========================

  /** Tính tổng cho mảng lines (không có commission) */
  calculateTotalForArray(lines: CalculateData[]): CalculateTotal {
    return lines.reduce<CalculateTotal>(
      (total, item) => {
        this.calculateLine(item);
        total.quantity += item.quantity ?? 0;
        total.subTotal += item.subTotal ?? 0;
        total.taxAmount += item.taxAmount ?? 0;
        total.grossAmount += item.grossAmount ?? 0;
        return total;
      },
      { quantity: 0, subTotal: 0, taxAmount: 0, grossAmount: 0 },
    );
  }

  /** Tính tổng đầy đủ cho Purchase (có commission) */
  calculatePurchaseTotal(lines: CalculateData[]): PurchaseTotal {
    return lines.reduce<PurchaseTotal>(
      (total, item) => {
        this.calculateLine(item);
        total.quantity += item.quantity ?? 0;
        total.subTotal += item.subTotal ?? 0;
        total.taxAmount += item.taxAmount ?? 0;
        total.grossAmount += item.grossAmount ?? 0;
        total.totalCommissionAmount += item.commissionAmount ?? 0;
        return total;
      },
      {
        quantity: 0,
        subTotal: 0,
        taxAmount: 0,
        grossAmount: 0,
        totalCommissionAmount: 0,
        discountAmount: 0,
      },
    );
  }

  /**
   * Tính tổng ở cấp chứng từ. VAT được tính một lần trên toàn đơn sau chiết
   * khấu; taxValue có thể là phần trăm hoặc số tiền người dùng nhập trực tiếp.
   */
  calculateDocumentTotal(
    lines: CalculateData[],
    options: DocumentCalculationOptions = {},
  ): DocumentTotal {
    const lineTotal = this.calculatePurchaseTotal(lines);
    const discountType = options.discountType || "amount";
    const taxType = options.taxType || "percent";
    const discountValue = Math.max(0, Number(options.discountValue || 0));
    const taxValue = Math.max(0, Number(options.taxValue || 0));
    const discountAmount = Math.min(
      lineTotal.subTotal,
      discountType === "percent"
        ? (lineTotal.subTotal * discountValue) / 100
        : discountValue,
    );
    const taxableAmount = Math.max(0, lineTotal.subTotal - discountAmount);
    const taxAmount =
      taxType === "percent" ? (taxableAmount * taxValue) / 100 : taxValue;

    return {
      ...lineTotal,
      discountAmount,
      taxType,
      taxValue,
      taxAmount,
      grossAmount: taxableAmount + taxAmount,
    };
  }
}
