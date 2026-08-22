import { File } from "@/database/models/File";
import { ProductVariantSnapshot } from "../product";
import { OrderSnapshot } from "../order/order.types";
import { AttributeTypeEnum, OrderTypeEnum } from "@/shared/constants/enum";
import { Product } from "@/database/models/Product";

// TODO: ============= Overview Dashboard (Dashboard tổng quan) =============
export interface OverviewMetrics {
  totalRevenue: number; // Tổng doanh thu (sum netAmount của đơn bán)
  revenueGrowth: number; // Tăng trưởng doanh thu so với kỳ trước (%)

  totalOrders: number; // Tổng số đơn hàng bán
  orderGrowth: number; // Tăng trưởng số đơn hàng (%)

  totalProductsSold: number; // Tổng số lượng sản phẩm bán ra (sum quantity)
  productsSoldGrowth: number; // Tăng trưởng số lượng sản phẩm bán (%)

  totalReturnOrders: number; // Tổng số đơn hoàn
  returnOrderGrowth: number; // Tăng trưởng đơn hoàn (%)

  totalReturnValue: number; // Tổng giá trị đơn hoàn
  returnValueGrowth: number; // Tăng trưởng giá trị đơn hoàn (%)

  totalProductsReturned: number; // Tổng số lượng sản phẩm hoàn
  productsReturnedGrowth: number; // Tăng trưởng số lượng sản phẩm hoàn (%)
}

export interface OverviewRevenueByDate {
  date: string; // YYYY-MM-DD
  revenue: number; // Doanh thu ngày đó
  orders: number; // Số đơn hàng ngày đó
}

export interface OverviewIncomeExpenseByAttribute {
  id: string;
  name: string;
  amount: number;
  type: AttributeTypeEnum; // INCOME_CATEGORY hoặc EXPENSE_CATEGORY
}

export interface TopStore {
  id: string;
  name: string;
  code: string;
  image?: File[];
  revenue: number; // Doanh thu
  orders: number; // Số đơn hàng
}
export interface TopProduct {
  id: string;
  name: string;
  code: string;
  album?: File[];
  revenue: number; // Doanh thu
  quantity: number; // Số lượng bán
}
export interface TopCustomer {
  id: string;
  name: string;
  code: string;
  avatar?: File[];
  revenue: number; // Doanh thu
  orders: number; // Số đơn hàng
}
export interface TopEmployee {
  id: string;
  name: string;
  code: string;
  avatar?: File[];
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface DashboardOverviewData {
  metrics: OverviewMetrics;

  // Biểu đồ doanh thu kỳ hiện tại
  revenueByDate: OverviewRevenueByDate[];

  // Biểu đồ doanh thu kỳ trước (cùng mốc thời gian nhưng trừ đi 1 năm)
  revenueByDateLastYear: OverviewRevenueByDate[];

  // Thu chi
  totalIncome: number; // Tổng thu
  totalExpense: number; // Tổng chi
  incomeByAttribute: OverviewIncomeExpenseByAttribute[]; // Thu theo attribute INCOME_CATEGORY
  expenseByAttribute: OverviewIncomeExpenseByAttribute[]; // Chi theo attribute EXPENSE_CATEGORY

  // Top lists
  recentOrders: OrderSnapshot[]; // 10 đơn bán gần nhất
  topProducts: TopProduct[]; // 5 sản phẩm doanh thu cao nhất
}

// TODO: ============= Profit Dashboard (Dashboard lợi nhuận) =============
export interface ProfitMetrics {
  // === DOANH THU TỪ BÁN HÀNG ===
  totalSalesRevenue: number; // Tổng doanh thu từ bán hàng (tổng netAmount của đơn bán + đơn hoàn)
  salesRevenueGrowth: number; // Tăng trưởng doanh thu bán hàng so với kỳ trước (%)

  // === DOANH THU KHÁC ===
  totalOtherIncome: number; // Tổng doanh thu khác (không phải từ bán hàng)
  otherIncomeGrowth: number; // Tăng trưởng doanh thu khác so với kỳ trước (%)
  // Tính: SUM(incomeExpense.amount) với type = 'income' và partnerId IS NULL

  // === TỔNG DOANH THU ===
  totalRevenue: number; // Tổng doanh thu từ bán hàng (tổng netAmount)
  revenueGrowth: number; // Tăng trưởng doanh thu so với kỳ trước (%)

  // === CHI PHÍ VỐN HÀNG BÁN (COGS) ===
  totalCost: number; // Tổng giá vốn hàng bán
  costGrowth: number; // Tăng trưởng giá vốn so với kỳ trước (%)
  // Tính: tổng amount của inventoryTransaction với type = 'sale' và 'return' trong kỳ
  // đơn hoàn có cả mặt hàng hoàn nên sẽ trừ đi

  // === PHÍ VẬN CHUYỂN ===
  totalShippingExpense: number; // Tổng phí vận chuyển với những đơn miễn phí vận chuyển
  shippingExpenseGrowth: number; // Tăng trưởng phí vận chuyển so với kỳ trước (%)
  // Tính: SUM(order.shippingFee) với order.type = 'sale' hoặc 'return'

  // === CHI PHÍ KHÁC ===
  totalOtherExpense: number; // Tổng chi phí khác (không phải giá vốn và phí vận chuyển)
  otherExpenseGrowth: number; // Tăng trưởng chi phí khác so với kỳ trước (%)
  // Tính: SUM(incomeExpense.amount) với type = 'expense' và partnerId IS NULL

  // === TỔNG CHI PHÍ ===
  totalExpense: number; // Tổng chi phí
  expenseGrowth: number; // Tăng trưởng tổng chi phí so với kỳ trước (%)

  // === LỢI NHUẬN GỘP ===
  grossProfit: number; // Lợi nhuận gộp = totalRevenue - totalCost
  grossProfitGrowth: number;
  grossProfitMargin: number; // (grossProfit / totalRevenue) * 100

  // === ĐIỀU CHỈNH TỒN KHO ===
  totalInventoryAdjustmentValue: number; // Tổng giá trị điều chỉnh tồn kho trong kỳ
  inventoryAdjustmentValueGrowth: number;
  // Tính: SUM(inventoryTransaction.amount) với refType = 'adjust' (IN tăng, OUT giảm)

  // === ĐIỀU CHỈNH QUỸ ===
  totalFundAdjustmentValue: number; // Tổng giá trị điều chỉnh quỹ trong kỳ (chỉ toàn hệ thống)
  fundAdjustmentValueGrowth: number;
  // Tính: SUM(fundAdjustment.deltaAmount) với direction (INCREASE tăng, DECREASE giảm)
  // Lưu ý: Khi xem theo storeId thì fundAdjustment = 0

  // === ĐIỀU CHỈNH CÔNG NỢ ===
  totalReceivableAdjustmentValue: number; // Tổng giá trị điều chỉnh công nợ trong kỳ
  receivableAdjustmentValueGrowth: number;
  // Tính: SUM(partnerDebtAdjustment.deltaAmount) với direction (INCREASE tăng, DECREASE giảm)

  // === LỢI NHUẬN ===
  netProfit: number; // Lợi nhuận ròng = totalRevenue - totalExpense + inventoryAdjustment + fundAdjustment + partnerDebtAdjustment
  netProfitGrowth: number; // Tăng trưởng lợi nhuận ròng so với kỳ trước (%)
  netProfitMargin: number; // Tỷ suất lợi nhuận ròng (%)
}
export interface RevenueByCategory {
  // Doanh thu theo danh mục sản phẩm (Chỉ lấy những danh mục cấp 1) (doanh thu của chính nó hoặc con cháu của nó)
  id: string;
  name: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  orders: number; // Tổng số đơn hàng
}
export interface RevenueByEmployee {
  id: string;
  name: string;
  code: string;
  avatar?: File[];
  revenue: number;
  cost: number;
  grossProfit: number;
  orders: number; // Số đơn hàng
}
export interface RevenueByStore {
  id: string;
  name: string;
  code: string;
  image?: File[];
  revenue: number;
  cost: number;
  grossProfit: number;
  orders: number; // Số đơn hàng
}

export interface DashboardProfitData {
  metrics: ProfitMetrics;

  // Biểu đồ doanh thu bán hàng (tổng netAmount của đơn bán + đơn hoàn trong ngày)
  saleRevenueByDate: OverviewRevenueByDate[];

  // Biểu đồ giá vốn bán hàng (tổng giá vốn xuất bán + giá vốn hoàn trong ngày)
  saleCostByDate: OverviewRevenueByDate[];

  // Biểu đồ lợi nhuận gộp trong ngày (doanh thu - giá vốn)
  grossProfitByDate: OverviewRevenueByDate[];

  ortherIncomeDetails: OverviewIncomeExpenseByAttribute[]; // Thu khác theo attribute INCOME_CATEGORY
  otherExpenseDetails: OverviewIncomeExpenseByAttribute[]; // Chi khác theo attribute EXPENSE_CATEGORY

  // Top lists
  topProducts: TopProduct[]; // 10 sản phẩm doanh thu cao nhất
  topStores: TopStore[]; // 5 cửa hàng doanh thu cao nhất
  topEmployees: TopEmployee[]; // 5 nhân viên doanh thu cao nhất
  topCustomers: TopCustomer[]; // 5 đối tác doanh thu cao nhất

  // Cơ cấu doanh thu theo danh mục sản phẩm
  revenueByCategory: RevenueByCategory[];
  // Cơ cấu doanh thu theo nhân viên
  revenueByEmployee: RevenueByEmployee[];
  // Cơ cấu doanh thu theo đối tác
  revenueByStore?: RevenueByStore[];
}

// TODO: ============= Sales Metrics =============
export interface SalesMetrics {
  // === DOANH THU BÁN HÀNG ===
  totalRevenue: number; // Tổng doanh thu (không bao gồm thuế)
  revenueGrowth: number; // Tăng trưởng doanh thu so với kỳ trước (%)
  // Tính: SUM(orderLine.price * orderLine.quantity) với order.type = 'sale'

  totalRevenueWithTax: number; // Tổng doanh thu có thuế
  revenueWithTaxGrowth: number;
  // Tính: totalRevenue + totalSalesTax

  totalSalesTax: number; // Tổng thuế VAT đầu ra từ bán hàng
  salesTaxGrowth: number;
  // Tính: SUM(orderLine.taxAmount) với order.type = 'sale'

  totalCost: number; // Tổng giá vốn hàng bán (COGS - Cost of Goods Sold)
  costGrowth: number;
  // Tính: SUM(orderLine.costPrice * orderLine.quantity) với order.type = 'sale'

  grossProfit: number; // Lợi nhuận gộp
  grossProfitGrowth: number;
  // Tính: totalRevenue - totalCost

  grossProfitMargin: number; // Tỷ suất lợi nhuận gộp (%)
  // Tính: (grossProfit / totalRevenue) * 100

  // === ĐƠN HÀNG ===
  totalOrders: number; // Tổng số đơn hàng bán
  orderGrowth: number; // Tăng trưởng số đơn hàng so với kỳ trước (%)
  // Tính: COUNT(order) với order.type = 'sale'

  avgOrderValue: number; // Giá trị đơn hàng trung bình (AOV - Average Order Value)
  avgOrderValueGrowth: number; // Tăng trưởng AOV so với kỳ trước (%)
  // Tính: totalRevenue / totalOrders

  // === GIẢM GIÁ & KHUYẾN MÃI ===
  totalDiscount: number; // Tổng giá trị giảm giá
  discountGrowth: number; // Tăng trưởng giảm giá so với kỳ trước (%)
  // Tính: SUM(order.discountAmount) với order.type = 'sale'

  discountRate: number; // Tỷ lệ giảm giá trung bình (%)
  // Tính: (totalDiscount / (totalRevenue + totalDiscount)) * 100
}

export interface DashboardSalesData {
  metrics: SalesMetrics;

  // Biểu đồ doanh thu kỳ hiện tại
  revenueByDate: RevenueByDate[];
  // Biểu đồ doanh thu kỳ trước (cùng mốc thời gian nhưng trừ đi 1 năm)
  revenueByDateLastYear: RevenueByDate[];

  // Top lists
  topProducts: TopProduct[]; // 10 sản phẩm doanh thu cao nhất
  topStores: TopStore[]; // 5 cửa hàng doanh thu cao nhất
  topEmployees: TopEmployee[]; // 5 nhân viên doanh thu cao nhất
  topCustomers: TopCustomer[]; // 5 đối tác doanh thu cao nhất

  // Cơ cấu doanh thu theo danh mục sản phẩm
  revenueByCategory: RevenueByCategory[];
  // Cơ cấu doanh thu theo nhân viên
  revenueByEmployee: RevenueByEmployee[];
  // Cơ cấu doanh thu theo cửa hàng (chỉ hiển thị khi xem toàn cục)
  revenueByStore: RevenueByStore[];
}

// TODO: ============= Purchase Metrics =============
export interface PurchaseMetrics {
  // === MUA HÀNG ===
  totalPurchaseAmount: number; // Tổng giá trị mua hàng
  purchaseGrowth: number; // Tăng trưởng mua hàng so với kỳ trước (%)
  // Tính: SUM(orderLine.price * orderLine.quantity) với order.type = 'purchase'

  totalPurchaseTax: number; // Tổng thuế VAT đầu vào
  purchaseTaxGrowth: number; // Tăng trưởng thuế đầu vào so với kỳ trước (%)
  // Tính: SUM(orderLine.taxAmount) với order.type = 'purchase'

  totalPurchaseOrders: number; // Tổng số đơn mua hàng
  purchaseOrderGrowth: number; // Tăng trưởng số đơn mua hàng so với kỳ trước (%)
  // Tính: COUNT(order) với order.type = 'purchase'

  avgPurchaseOrderValue: number; // Giá trị đơn mua hàng trung bình
  avgPurchaseOrderValueGrowth: number; // Tăng trưởng giá trị đơn mua hàng trung bình so với kỳ trước (%)
  // Tính: totalPurchaseAmount / totalPurchaseOrders
}

// ============= Cash Flow Summary (Dòng tiền) =============

export interface FundMetrics {
  // === QUỸ TIỀN ===
  totalFundBalance: number; // Tổng quỹ hiện tại
  fundBalanceGrowth: number; // Tăng trưởng quỹ so với kỳ trước (%)
  // Tính: SUM(fund.currentBalance)

  cashBalance: number; // Số dư tiền mặt
  cashBalanceGrowth: number;
  // Tính: SUM(fund.currentBalance) với fund.type = 'cash'

  bankBalance: number; // Số dư ngân hàng
  bankBalanceGrowth: number;
  // Tính: SUM(fund.currentBalance) với fund.type = 'bank'

  // === DÒNG TIỀN TRONG KỲ ===
  cashInflow: number; // Tổng tiền vào
  cashInflowGrowth: number;
  // Tính: SUM(fundBalance.amount) với fundBalance.type = 'increase' trong kỳ

  cashOutflow: number; // Tổng tiền ra
  cashOutflowGrowth: number;
  // Tính: SUM(fundBalance.amount) với fundBalance.type = 'decrease' trong kỳ

  netCashFlow: number; // Dòng tiền ròng
  netCashFlowGrowth: number;
  // Tính: cashInflow - cashOutflow
}

export interface IncomeExpenseMetrics {
  // === THU CHI KHÁC ===
  totalIncome: number; // Tổng thu khác (không phải từ bán hàng)
  incomeGrowth: number;
  // Tính: SUM(incomeExpense.amount) với type = 'income' trong kỳ

  totalExpense: number; // Tổng chi phí
  expenseGrowth: number;
  // Tính: SUM(incomeExpense.amount) với type = 'expense' trong kỳ

  netIncomeExpense: number; // Thu chi ròng
  netIncomeExpenseGrowth: number;
  // Tính: totalIncome - totalExpense

  // === PHÂN LOẠI CHI PHÍ ===
  totalGeneralExpense: number; // Tổng chi không theo đối tác
  generalExpenseGrowth: number;

  totalGeneralIncome: number; // tổng thu không theo đối tác
  generalIncomeGrowth: number;
}

// ============= Inventory Summary (Tồn kho) =============

export interface InventoryMetrics {
  // === TỒN KHO ===
  totalInventoryValue: number; // Tổng giá trị tồn kho
  inventoryValueGrowth: number; // Tăng trưởng giá trị tồn kho (%)
  // Tính: SUM(inventory.quantity * inventory.costPrice)

  totalStockQty: number; // Tổng số lượng tồn kho
  stockQtyGrowth: number;
  // Tính: SUM(inventory.quantity)

  totalProducts: number; // Tổng số sản phẩm
  productsGrowth: number;
  // Tính: COUNT(DISTINCT product)

  totalVariants: number; // Tổng số biến thể
  variantsGrowth: number;
  // Tính: COUNT(productVariant)

  // === HÀNG SẮP HẾT / HẾT HÀNG ===
  outOfStockItems: number; // Số sản phẩm hết hàng
  outOfStockItemsGrowth: number;
  // Tính: COUNT(inventory) với quantity = 0

  lowStockItems: number; // Số sản phẩm sắp hết hàng
  lowStockItemsGrowth: number;
  // Tính: COUNT(inventory) với quantity < minimumStockLevel

  overstockItems: number; // Số sản phẩm tồn kho quá nhiều
  overstockItemsGrowth: number;
  // Tính: COUNT(inventory) với quantity > maximumStockLevel

  // === ĐIỀU CHỈNH TỒN KHO ===
  totalAdjustmentValue: number; // Tổng giá trị điều chỉnh tồn kho trong kỳ
  adjustmentValueGrowth: number;
  // Tính: SUM(inventoryAdjustment.deltaAmount) trong kỳ

  totalAdjustmentQty: number; // Tổng số lượng điều chỉnh tồn kho trong kỳ
  adjustmentQtyGrowth: number;
  // Tính: SUM(inventoryAdjustment.deltaQty) trong kỳ

  positiveAdjustments: number; // Số lần điều chỉnh tăng
  // Tính: COUNT(inventoryAdjustment) với deltaAmount > 0

  negativeAdjustments: number; // Số lần điều chỉnh giảm
  // Tính: COUNT(inventoryAdjustment) với deltaAmount < 0
}

// ============= Debt Summary (Công nợ) =============

export interface DebtMetrics {
  // === CÔNG NỢ PHẢI THU (Receivables) ===
  totalReceivable: number; // Tổng công nợ phải thu
  receivableGrowth: number; // Tăng trưởng công nợ phải thu (%)
  // Tính: SUM(debt.amount) với debt.type = 'receivable'

  // === CÔNG NỢ PHẢI TRẢ (Payables) ===
  totalPayable: number; // Tổng công nợ phải trả
  payableGrowth: number; // Tăng trưởng công nợ phải trả (%)
  // Tính: SUM(debt.amount) với debt.type = 'payable'

  // === CÔNG NỢ THUẾ ===
  vatPayable: number; // Thuế VAT phải nộp
  vatPayableGrowth: number;
  // Tính: totalSalesTax - totalPurchaseTax

  // === CHỈ SỐ CÔNG NỢ ===
  netDebt: number; // Công nợ ròng
  netDebtGrowth: number;
  // Tính: totalReceivable - totalPayable
  debtRatio: number; // Tỷ lệ nợ (%)
  // Tính: (totalPayable / (totalFundBalance + totalReceivable)) * 100

  // === ĐIỀU CHỈNH CÔNG NỢ ===
  receiableDebtAdjustmentValue: number;
  receiableDebtAdjustmentValueGrowth: number;
  payableDebtAdjustmentValue: number;
  payableDebtAdjustmentValueGrowth: number;
  // Tính: SUM(debtAdjustment.deltaAmount) trong kỳ

  debtAdjustmentCount: number; // Số lần điều chỉnh công nợ
  debtAdjustmentCountGrowth: number;
  // Tính: COUNT(debtAdjustment) trong kỳ

  vatDebtAdjustmentValue: number; // Giá trị điều chỉnh công nợ thuế
  vatDebtAdjustmentValueGrowth: number;
  // Tính: SUM(vatDebtAdjustment.deltaAmount) trong kỳ
  vatDebtAdjustmentCount: number; // Số lần điều chỉnh công nợ thuế
  vatDebtAdjustmentCountGrowth: number;
  // Tính: COUNT(vatDebtAdjustment) trong kỳ
}

// ============= Partner Summary (Đối tác) =============

export interface PartnerMetrics {
  // === KHÁCH HÀNG (Customers) ===
  totalCustomers: number; // Tổng số khách hàng
  // Tính: COUNT(partner) với type = 'customer'

  activeCustomers: number; // Số khách hàng có giao dịch trong kỳ
  // Tính: COUNT(DISTINCT order.partnerId) với order.type = 'sale'

  newCustomers: number; // Số khách hàng mới trong kỳ
  // Tính: COUNT(partner) với type = 'customer' và createdAt trong kỳ

  returningCustomers: number; // Số khách hàng quay lại (mua >1 lần)
  // Tính: COUNT(partnerId) với COUNT(order) > 1

  customerRetentionRate: number; // Tỷ lệ giữ chân khách hàng (%)
  // Tính: (returningCustomers / totalCustomers) * 100

  customerChurnRate: number; // Tỷ lệ khách hàng rời bỏ (%)
  // Tính: (customersLost / totalCustomers) * 100

  avgCustomerLifetimeValue: number; // Giá trị trọn đời khách hàng trung bình (CLV)
  // Tính: totalRevenue / totalCustomers

  avgOrdersPerCustomer: number; // Số đơn hàng trung bình mỗi khách hàng
  // Tính: totalOrders / activeCustomers

  // === NHÀ CUNG CẤP (Suppliers) ===
  totalSuppliers: number; // Tổng số nhà cung cấp
  // Tính: COUNT(partner) với type = 'supplier'

  activeSuppliers: number; // Số nhà cung cấp có giao dịch trong kỳ
  // Tính: COUNT(DISTINCT order.partnerId) với order.type = 'purchase'

  newSuppliers: number; // Số nhà cung cấp mới trong kỳ
  // Tính: COUNT(partner) với type = 'supplier' và createdAt trong kỳ

  avgOrdersPerSupplier: number; // Số đơn mua trung bình mỗi nhà cung cấp
  // Tính: totalPurchaseOrders / activeSuppliers

  // === SHIPPER ===
  totalShippers: number; // Tổng số shipper
  // Tính: COUNT(partner) với type = 'shipper'

  activeShippers: number; // Số shipper hoạt động trong kỳ
  // Tính: COUNT(DISTINCT order.shipperId) trong kỳ

  // === TĂNG TRƯỞNG ===
  customerGrowth: number; // Tăng trưởng số khách hàng (%)
  // Tính: ((currentCustomers - previousCustomers) / previousCustomers) * 100

  supplierGrowth: number; // Tăng trưởng số nhà cung cấp (%)
  // Tính: ((currentSuppliers - previousSuppliers) / previousSuppliers) * 100
}

export interface StoreMetrics {
  // === CỬA HÀNG (Multi-store system) ===
  totalStores: number; // Tổng số cửa hàng
  // Tính: COUNT(store)

  activeStores: number; // Số cửa hàng đang hoạt động
  // Tính: COUNT(store) với isActive = true

  avgRevenuePerStore: number; // Doanh thu trung bình mỗi cửa hàng
  // Tính: totalRevenue / activeStores

  topStoreRevenue: number; // Doanh thu của cửa hàng tốt nhất
  // Tính: MAX(SUM(order.totalAmount) GROUP BY storeId)

  storeTransferCount: number; // Số lần chuyển hàng giữa các cửa hàng
  // Tính: COUNT(storeTransfer) trong kỳ

  storeTransferValue: number; // Giá trị hàng chuyển giữa các cửa hàng
  // Tính: SUM(storeTransferLine.quantity * costPrice)
}

// ============= Main Dashboard Summary =============

export interface DashboardSummary {
  sales: SalesMetrics;
  purchase: PurchaseMetrics;
  profit: ProfitMetrics;
  fund?: FundMetrics;
  incomeExpense: IncomeExpenseMetrics;
  inventory: InventoryMetrics;
  debt: DebtMetrics;
  partner: PartnerMetrics;
  // employee: EmployeeMetrics;
  store?: StoreMetrics;

  // Dữ liệu kỳ trước để so sánh (nếu compareWithPrevious = true)
  previousPeriod?: {
    sales: Partial<SalesMetrics>;
    purchase: Partial<PurchaseMetrics>;
    profit: Partial<ProfitMetrics>;
    fund?: Partial<FundMetrics>;
    incomeExpense: Partial<IncomeExpenseMetrics>;
    inventory: Partial<InventoryMetrics>;
    debt: Partial<DebtMetrics>;
    partner: Partial<PartnerMetrics>;
    // employee: Partial<EmployeeMetrics>;
    store?: Partial<StoreMetrics>;
  };
}

// ============= Charts Models (Biểu đồ) =============

// Doanh thu theo thời gian
export interface RevenueByDate {
  date: string; // YYYY-MM-DD
  revenue: number; // Doanh thu ngày đó
  cost: number; // Giá vốn ngày đó
  profit: number; // Lợi nhuận ngày đó
  orders: number; // Số đơn hàng ngày đó
  avgOrderValue: number; // Giá trị đơn hàng trung bình
  productsSold: number; // Số lượng sản phẩm bán ra ngày đó
}

// Thu chi theo thời gian
export interface IncomeExpenseByDate {
  date: string; // YYYY-MM-DD
  income: number; // Thu trong ngày
  expense: number; // Chi trong ngày
  netCashFlow: number; // Dòng tiền ròng
  fundBalance: number; // Số dư quỹ cuối ngày
}

// Doanh thu theo danh mục sản phẩm
export interface CategoryRevenue {
  id: string;
  name: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number; // Tỷ suất lợi nhuận
  percentage: number; // % doanh thu so với tổng
  soldQuantity: number; // Số lượng bán ra
}

// Doanh thu theo cửa hàng (nếu multi-store)
export interface StoreRevenue {
  id: string;
  name: string;
  image?: File[];
  revenue: number;
  orders: number;
  percentage: number; // % doanh thu so với tổng
}

// Phân tích chi phí
export interface ExpenseBreakdown {
  id: string;
  name: string;
  amount: number;
  percentage: number; // % chi phí so với tổng
}

export interface DashboardCharts {
  revenueByDate: RevenueByDate[];
  incomeExpenseByDate: IncomeExpenseByDate[];
  categoryRevenue: CategoryRevenue[];
  storeRevenue?: StoreRevenue[];
  expenseBreakdown: ExpenseBreakdown[];
  // employeePerformance: EmployeePerformance[];
}

// ============= Top Lists Models (Danh sách xếp hạng) =============

export interface TopSellingProduct {
  id: string;
  name: string;
  code: string;
  album?: File[];
  categoryName: string;
  soldQuantity: number; // Số lượng bán ra
  revenue: number; // Doanh thu
  profit: number; // Lợi nhuận
  profitMargin: number; // Tỷ suất lợi nhuận
  stockQty: number; // Tồn kho hiện tại
}

// export interface TopCustomer {
//   id: string;
//   name: string;
//   code: string;
//   avatar?: File[];
//   orderCount: number; // Số đơn hàng
//   totalRevenue: number; // Tổng doanh thu
//   avgOrderValue: number; // Giá trị đơn hàng trung bình
//   lastOrderDate: string; // Ngày mua hàng gần nhất
//   debtAmount: number; // Công nợ hiện tại
//   loyaltyLevel?: string; // "VIP", "Gold", "Silver", "Bronze"
// }

export interface TopSupplier {
  id: string;
  name: string;
  code: string;
  avatar?: File[];
  orderCount: number; // Số đơn mua
  totalPurchase: number; // Tổng giá trị mua
  avgOrderValue: number; // Giá trị đơn mua trung bình
  lastOrderDate: string; // Ngày mua gần nhất
  debtAmount: number; // Công nợ hiện tại
}

export interface LowStockProduct {
  id: string;
  name: string;
  code: string;
  album?: File[];
  categoryName: string;
  currentStock: number;
  minimumStock: number;
  avgDailySales: number; // Số lượng bán trung bình mỗi ngày
  daysUntilStockout: number; // Số ngày sẽ hết hàng
  reorderRecommendation: number; // Đề xuất số lượng nên đặt hàng
}

export interface DeadStockProduct {
  id: string;
  name: string;
  album?: File[];
  currentStock: number;
  stockValue: number;
  lastSoldDate: string;
  daysWithoutSale: number;
  recommendation: string; // "Discount", "Clearance", "Return to Supplier"
}

export interface ProfitableProduct {
  id: string;
  name: string;
  album?: File[];
  revenue: number;
  cost: number;
  profit: number; // Lợi nhuận
  profitMargin: number; // Tỷ suất lợi nhuận
}

export interface TopDebtCustomer {
  id: string;
  name: string;
  code: string;
  avatar?: File[];
  amount: number; // Số tiền nợ
}

export interface DashboardTopLists {
  topSellingProducts: TopSellingProduct[]; // Top 10 sản phẩm bán chạy
  topCustomers: TopCustomer[]; // Top 10 khách hàng
  topSuppliers: TopSupplier[]; // Top 10 nhà cung cấp
  lowStockProducts: LowStockProduct[]; // Sản phẩm sắp hết hàng
  // deadStockProducts: DeadStockProduct[]; // Sản phẩm tồn kho chết
  topProfitableProducts: ProfitableProduct[]; // Sản phẩm lợi nhuận cao nhất
  topDebtCustomers: TopDebtCustomer[]; // Khách hàng nợ nhiều nhất
}

// TODO: ============= Product Metrics =============
export interface ProductMetrics {
  totalProducts: number; // Tổng số sản phẩm
  productGrowth: number; // Tăng trưởng số sản phẩm so với kỳ trước (%)

  newProducts: number; // Số sản phẩm mới trong kỳ
  newProductGrowth: number; // Tăng trưởng số sản phẩm mới so với kỳ trước (%)

  totalSellingProducts: number; // Số sản phẩm đã bán ra
  sellingProductGrowth: number; // Tăng trưởng số sản phẩm đã bán so với kỳ trước (%)

  totalPurchasedProducts: number; // Số sản phẩm đã mua vào
  purchasedProductGrowth: number; // Tăng trưởng số sản phẩm đã mua so với kỳ trước (%)

  // Tổng số lượng tồn cuối kỳ
  totalEndingInventory: number;
  endingInventoryGrowth: number; // Tăng trưởng số lượng tồn cuối kỳ so với kỳ trước (%)

  // Tổng giá trị tồn cuối kỳ
  totalEndingInventoryValue: number;
  endingInventoryValueGrowth: number; // Tăng trưởng giá trị tồn cuối kỳ so với kỳ trước (%)

  // Điều chỉnh trong kỳ
  totalInventoryAdjustment: number; // Tổng số lượng điều chỉnh tồn kho trong kỳ
  inventoryAdjustmentGrowth: number; // Tăng trưởng số lượng điều chỉnh tồn kho so với kỳ trước (%)

  totalInventoryAdjustmentValue: number; // Tổng giá trị điều chỉnh tồn kho trong kỳ
  inventoryAdjustmentValueGrowth: number; // Tăng trưởng giá trị điều chỉnh tồn kho so với kỳ trước (%)
}

export interface DashboardProductData {
  metrics: ProductMetrics;

  revenueByDate: RevenueByDate[]; // Doanh thu theo ngày

  topSellingProducts: TopSellingProduct[]; // 10 sản phẩm bán chạy nhất

  lowStockProducts: LowStockProduct[]; // 10 sản phẩm sắp hết hàng tồn < 10 > 0

  deadStockProducts: DeadStockProduct[]; // 10 sản phẩm tồn kho chết (không bán được trong kỳ này và còn tồn kho cuối kỳ)

  revenueByCategory: RevenueByCategory[]; // Doanh thu theo danh mục sản phẩm (chỉ lấy những danh mục cấp 1)
}

// TODO: ============= Detail Product Metrics =============
export interface ProductDetailMetrics {
  totalRevenue: number; // Tổng doanh thu của sản phẩm
  revenueGrowth: number; // Tăng trưởng doanh thu so với kỳ trước (%)

  totalQuantitySold: number; // Tổng số lượng bán ra
  quantitySoldGrowth: number; // Tăng trưởng số lượng bán ra so với kỳ trước (%)

  totalCost: number; // Tổng giá vốn của sản phẩm
  costGrowth: number; // Tăng trưởng giá vốn so với kỳ trước (%)

  grossProfit: number; // Lợi nhuận gộp của sản phẩm
  grossProfitGrowth: number; // Tăng trưởng lợi nhuận gộp so với kỳ trước (%)
  grossProfitMargin: number; // Tỷ suất lợi nhuận gộp (%)

  totalSoldOrders: number; // Tổng số đơn hàng có sản phẩm này
  soldOrderGrowth: number; // Tăng trưởng số đơn hàng có sản phẩm này so với kỳ trước (%)

  returnedQuantity: number; // Tổng số lượng hoàn trả
  returnedQuantityGrowth: number; // Tăng trưởng số lượng hoàn trả so với kỳ trước (%)

  returnRate: number; // Tỷ lệ hoàn trả (%)

  averageSellingPrice: number; // Giá bán trung bình
  averageCostPrice: number; // Giá vốn trung bình

  // tồn cuối kỳ
  endingInventory: number; // Số lượng tồn cuối kỳ
  endingInventoryGrowth: number; // Tăng trưởng số lượng tồn cuối kỳ so với kỳ trước (%)

  endingInventoryValue: number; // Giá trị tồn cuối kỳ
  endingInventoryValueGrowth: number; // Tăng trưởng giá trị tồn cuối kỳ so với kỳ trước (%)
}
export interface DashboardDetailProductData {
  data: Product;

  metrics: ProductDetailMetrics;

  revenueByDate: RevenueByDate[]; // Doanh thu theo ngày (chỉ tính riêng cho sản phẩm này)

  soldOrders: OrderSnapshot[]; // 10 đơn hàng bán có sản phẩm này gần nhất
}

// ============= Alerts & Notifications (Cảnh báo) =============

export interface DashboardAlert {
  type: "warning" | "danger" | "info"; // Mức độ cảnh báo
  category: string; // "inventory", "debt", "cash", "order"
  message: string; // Nội dung cảnh báo
  value?: number; // Giá trị liên quan
  actionRequired?: string; // Hành động cần thực hiện
  priority: number; // Độ ưu tiên (1-5)
}

export interface DashboardAlerts {
  // Tự động sinh các cảnh báo dựa trên ngưỡng
  alerts: DashboardAlert[];

  // Ví dụ:
  // - "Có 15 sản phẩm sắp hết hàng"
  // - "Công nợ quá hạn >90 ngày đạt 50 triệu"
  // - "Quỹ tiền mặt thấp hơn mức an toàn"
  // - "10 đơn hàng chưa xử lý quá 24h"
  // - "Tồn kho chết chiếm 20% tổng giá trị"
}

// ============= Main Dashboard Data Model =============

export interface DashboardData {
  summary: DashboardSummary;
  charts: DashboardCharts;
  topLists: DashboardTopLists;
  alerts: DashboardAlerts;

  // Metadata
  generatedAt: string; // Thời gian tạo dashboard
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}
