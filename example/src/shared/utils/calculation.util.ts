export type CalculateData = {
  quantity?: number;
  unitPrice?: number;
  taxRate?: number;
  commissionRate?: number;
  [key: string]: any;
};

type CalculateTotal = {
  quantity: number;
  subTotal: number;
  taxAmount: number;
  grossAmount: number;
};

type PurchaseTotal = CalculateTotal & {
  totalCommissionAmount: number;
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
      },
    );
  }
}
