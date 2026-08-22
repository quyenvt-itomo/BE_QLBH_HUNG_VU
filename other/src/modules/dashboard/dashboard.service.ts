import { injectable, inject } from "inversify";
import { DashboardRepository } from "./dashboard.repository";
import { ApiResponse } from "@/shared/types/interfaces";
import { ApiResponseHandler } from "@/shared/utils/response.utils";
import dayjs from "dayjs";
import { DASHBOARD_TYPES } from "./dashboard.types";
import { DashboardQueryDto } from "./dashboard.validator";
import {
  ProfitMetrics,
  DashboardOverviewData,
  DashboardProfitData,
  DashboardSalesData,
  SalesMetrics,
  DashboardProductData,
  DashboardDetailProductData,
} from "./dashboard.interface";
import { NotFoundError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";

@injectable()
export class DashboardService {
  constructor(
    @inject(DASHBOARD_TYPES.DashboardRepository)
    private dashboardRepository: DashboardRepository,
  ) {}

  /**
   * Get overview dashboard - simplified version
   */
  async getOverview(
    query: DashboardQueryDto = {},
  ): Promise<ApiResponse<DashboardOverviewData>> {
    const {
      startAt = dayjs().startOf("month").toDate(),
      endAt = dayjs().endOf("month").toDate(),
      storeId,
    } = query;

    const days = dayjs(endAt).diff(dayjs(startAt), "day") + 1;

    // Tính toán kỳ trước để so sánh growth
    const startAtPrev = dayjs(startAt).subtract(days, "day").toDate();
    const endAtPrev = startAt;

    // Tính toán kỳ cùng kỳ năm trước cho biểu đồ
    const startAtLastYear = dayjs(startAt).subtract(1, "year").toDate();
    const endAtLastYear = dayjs(endAt).subtract(1, "year").toDate();

    // Lấy dữ liệu song song
    const [
      currentMetrics,
      previousMetrics,
      revenueByDate,
      revenueByDateLastYear,
      incomeByAttribute,
      expenseByAttribute,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      // Current period metrics
      this.dashboardRepository.getOverviewMetrics(startAt, endAt, storeId),
      // Previous period metrics for growth calculation
      this.dashboardRepository.getOverviewMetrics(
        startAtPrev,
        endAtPrev,
        storeId,
      ),
      // Revenue by date (current period)
      this.dashboardRepository.getOverviewRevenueByDate(
        startAt,
        endAt,
        storeId,
      ),
      // Revenue by date (last year same period)
      this.dashboardRepository.getOverviewRevenueByDate(
        startAtLastYear,
        endAtLastYear,
        storeId,
      ),
      // Income by category
      this.dashboardRepository.getOverviewIncomeExpenseByAttribute(
        startAt,
        endAt,
        "income",
        storeId,
      ),
      // Expense by attribute
      this.dashboardRepository.getOverviewIncomeExpenseByAttribute(
        startAt,
        endAt,
        "expense",
        storeId,
      ),
      // Recent orders (10 most recent)
      this.dashboardRepository.getOverviewRecentOrders(
        startAt,
        endAt,
        storeId,
        10,
      ),
      // Top products by revenue (5 products)
      this.dashboardRepository.getOverviewTopProducts(
        startAt,
        endAt,
        storeId,
        5,
      ),
    ]);

    // Helper function to calculate growth
    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    // Calculate total income and expense
    const totalIncome = incomeByAttribute.reduce(
      (sum: number, item) => sum + item.amount,
      0,
    );
    const totalExpense = expenseByAttribute.reduce(
      (sum: number, item) => sum + item.amount,
      0,
    );

    // Build response data
    const data: DashboardOverviewData = {
      metrics: {
        totalRevenue: currentMetrics.totalRevenue,
        revenueGrowth: calcGrowth(
          currentMetrics.totalRevenue,
          previousMetrics.totalRevenue,
        ),
        totalOrders: currentMetrics.totalOrders,
        orderGrowth: calcGrowth(
          currentMetrics.totalOrders,
          previousMetrics.totalOrders,
        ),
        totalProductsSold: currentMetrics.totalProductsSold,
        productsSoldGrowth: calcGrowth(
          currentMetrics.totalProductsSold,
          previousMetrics.totalProductsSold,
        ),
        totalReturnOrders: currentMetrics.totalReturnOrders,
        returnOrderGrowth: calcGrowth(
          currentMetrics.totalReturnOrders,
          previousMetrics.totalReturnOrders,
        ),
        totalReturnValue: currentMetrics.totalReturnValue,
        returnValueGrowth: calcGrowth(
          currentMetrics.totalReturnValue,
          previousMetrics.totalReturnValue,
        ),
        totalProductsReturned: currentMetrics.totalProductsReturned,
        productsReturnedGrowth: calcGrowth(
          currentMetrics.totalProductsReturned,
          previousMetrics.totalProductsReturned,
        ),
      },
      revenueByDate: revenueByDate,
      revenueByDateLastYear: revenueByDateLastYear,
      totalIncome,
      totalExpense,
      incomeByAttribute,
      expenseByAttribute,
      recentOrders,
      topProducts,
    };

    return ApiResponseHandler.getSuccess(
      "Overview dashboard loaded successfully",
      data,
    );
  }

  /**
   * Get profit dashboard - detailed profit analysis
   */
  async getProfitReport(
    query: DashboardQueryDto = {},
  ): Promise<ApiResponse<any>> {
    const {
      startAt = dayjs().startOf("month").toDate(),
      endAt = dayjs().endOf("month").toDate(),
      storeId,
    } = query;

    const days = dayjs(endAt).diff(dayjs(startAt), "day") + 1;

    // Tính toán kỳ trước để so sánh growth
    const startAtPrev = dayjs(startAt).subtract(days, "day").toDate();
    const endAtPrev = startAt;

    // Lấy dữ liệu song song
    const [
      currentMetrics,
      previousMetrics,
      saleRevenueByDate,
      saleCostByDate,
      otherIncomeDetails,
      otherExpenseDetails,
      revenueByCategory,
      revenueByEmployee,
      topProducts,
      topCustomers,
    ] = await Promise.all([
      // Current period metrics
      this.dashboardRepository.getProfitMetrics(startAt, endAt, storeId),
      // Previous period metrics for growth calculation
      this.dashboardRepository.getProfitMetrics(
        startAtPrev,
        endAtPrev,
        storeId,
      ),
      // Sale revenue by date (current period)
      this.dashboardRepository.getSaleRevenueByDate(startAt, endAt, storeId),
      // Sale cost by date (current period)
      this.dashboardRepository.getSaleCostByDate(startAt, endAt, storeId),
      // Other income details by attribute
      this.dashboardRepository.getOverviewIncomeExpenseByAttribute(
        startAt,
        endAt,
        "income",
        storeId,
        true, // isOtherIncomeExpense
      ),
      // Other expense details by attribute
      this.dashboardRepository.getOverviewIncomeExpenseByAttribute(
        startAt,
        endAt,
        "expense",
        storeId,
        true, // isOtherIncomeExpense
      ),
      // Revenue by category (level 1 categories)
      this.dashboardRepository.getRevenueByCategory(startAt, endAt, storeId),
      // Revenue by employee
      this.dashboardRepository.getRevenueByEmployee(startAt, endAt, storeId),
      // Top products (SALE + SALE_RETURN)
      this.dashboardRepository.getTopProductsForProfit(
        startAt,
        endAt,
        storeId,
        10,
      ),
      // Top customers (SALE + SALE_RETURN)
      this.dashboardRepository.getTopCustomersForProfit(
        startAt,
        endAt,
        storeId,
        5,
      ),
    ]);

    // Revenue by store (only for global view)
    const revenueByStore = !storeId
      ? await this.dashboardRepository.getRevenueByStore(startAt, endAt)
      : undefined;

    // Map revenueByEmployee to topEmployees (top 5)
    const topEmployees = revenueByEmployee.slice(0, 5).map((emp) => ({
      id: emp.id,
      name: emp.name,
      code: emp.code,
      avatar: emp.avatar,
      revenue: emp.revenue,
      orders: emp.orders,
      avgOrderValue: emp.orders > 0 ? emp.revenue / emp.orders : 0,
    }));

    // Map revenueByStore to topStores (top 5, only when available)
    const topStores = revenueByStore
      ? revenueByStore.slice(0, 5).map((store) => ({
          id: store.id,
          name: store.name,
          code: store.code,
          image: store.image,
          revenue: store.revenue,
          orders: store.orders,
        }))
      : [];

    // Helper function to calculate growth
    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    // Build profit metrics with growth
    const profitMetrics: ProfitMetrics = {
      // === DOANH THU TỪ BÁN HÀNG ===
      totalSalesRevenue: currentMetrics.totalSalesRevenue,
      salesRevenueGrowth: calcGrowth(
        currentMetrics.totalSalesRevenue,
        previousMetrics.totalSalesRevenue,
      ),

      // === DOANH THU KHÁC ===
      totalOtherIncome: currentMetrics.totalOtherIncome,
      otherIncomeGrowth: calcGrowth(
        currentMetrics.totalOtherIncome,
        previousMetrics.totalOtherIncome,
      ),

      // === TỔNG DOANH THU ===
      totalRevenue: currentMetrics.totalRevenue,
      revenueGrowth: calcGrowth(
        currentMetrics.totalRevenue,
        previousMetrics.totalRevenue,
      ),

      // === CHI PHÍ VỐN HÀNG BÁN (COGS) ===
      totalCost: currentMetrics.totalCost,
      costGrowth: calcGrowth(
        currentMetrics.totalCost,
        previousMetrics.totalCost,
      ),

      // === PHÍ VẬN CHUYỂN ===
      totalShippingExpense: currentMetrics.totalShippingExpense,
      shippingExpenseGrowth: calcGrowth(
        currentMetrics.totalShippingExpense,
        previousMetrics.totalShippingExpense,
      ),

      // === CHI PHÍ KHÁC ===
      totalOtherExpense: currentMetrics.totalOtherExpense,
      otherExpenseGrowth: calcGrowth(
        currentMetrics.totalOtherExpense,
        previousMetrics.totalOtherExpense,
      ),

      // === TỔNG CHI PHÍ ===
      totalExpense: currentMetrics.totalExpense,
      expenseGrowth: calcGrowth(
        currentMetrics.totalExpense,
        previousMetrics.totalExpense,
      ),

      // === LỢI NHUẬN GỘP ===
      grossProfit: currentMetrics.grossProfit,
      grossProfitGrowth: calcGrowth(
        currentMetrics.grossProfit,
        previousMetrics.grossProfit,
      ),
      grossProfitMargin: currentMetrics.grossProfitMargin,

      // === ĐIỀU CHỈNH TỒN KHO ===
      totalInventoryAdjustmentValue: currentMetrics.inventoryAdjustment,
      inventoryAdjustmentValueGrowth: calcGrowth(
        currentMetrics.inventoryAdjustment,
        previousMetrics.inventoryAdjustment,
      ),

      // === ĐIỀU CHỈNH QUỸ ===
      totalFundAdjustmentValue: currentMetrics.fundAdjustment,
      fundAdjustmentValueGrowth: calcGrowth(
        currentMetrics.fundAdjustment,
        previousMetrics.fundAdjustment,
      ),

      // === ĐIỀU CHỈNH CÔNG NỢ ===
      totalReceivableAdjustmentValue: currentMetrics.partnerDebtAdjustment,
      receivableAdjustmentValueGrowth: calcGrowth(
        currentMetrics.partnerDebtAdjustment,
        previousMetrics.partnerDebtAdjustment,
      ),

      // === LỢI NHUẬN RÒNG ===
      netProfit: currentMetrics.netProfit,
      netProfitGrowth: calcGrowth(
        currentMetrics.netProfit,
        previousMetrics.netProfit,
      ),
      netProfitMargin: currentMetrics.netProfitMargin,
    };

    const costMap = new Map(saleCostByDate.map((e) => [e.date, e.revenue]));
    const grossProfitByDate = saleRevenueByDate.map((r) => ({
      date: r.date,
      revenue: r.revenue - (costMap.get(r.date) || 0),
      orders: r.orders,
    }));

    // Build response data
    const data: DashboardProfitData = {
      metrics: profitMetrics,
      saleRevenueByDate,
      saleCostByDate,
      grossProfitByDate,
      ortherIncomeDetails: otherIncomeDetails,
      otherExpenseDetails,
      topProducts,
      topStores,
      topEmployees,
      topCustomers,
      revenueByCategory,
      revenueByEmployee,
      revenueByStore,
    };

    return ApiResponseHandler.getSuccess(
      "Profit report loaded successfully",
      data,
    );
  }

  /**
   * Get Sales Report (chỉ đơn bán, không tính đơn hoàn)
   */
  async getSalesReport(
    query: DashboardQueryDto,
  ): Promise<ApiResponse<DashboardSalesData>> {
    const {
      startAt = dayjs().startOf("month").toDate(),
      endAt = dayjs().endOf("month").toDate(),
      storeId,
    } = query;

    const days = dayjs(endAt).diff(dayjs(startAt), "day") + 1;

    // Tính toán kỳ trước để so sánh growth
    const startAtPrev = dayjs(startAt).subtract(days, "day").toDate();
    const endAtPrev = startAt;

    const [
      currentMetrics,
      previousMetrics,
      revenueByDate,
      revenueByDateLastYear,
      revenueByCategory,
      revenueByEmployee,
      topProducts,
      topCustomers,
    ] = await Promise.all([
      // Current period metrics
      this.dashboardRepository.getSalesMetrics(startAt, endAt, storeId),
      // Previous period metrics for growth calculation
      this.dashboardRepository.getSalesMetrics(startAtPrev, endAtPrev, storeId),
      // Revenue by date (current period)
      this.dashboardRepository.getSalesRevenueByDate(startAt, endAt, storeId),
      // Revenue by date last year (same period but previous year)
      this.dashboardRepository.getSalesRevenueByDate(
        dayjs(startAt).subtract(1, "year").toDate(),
        dayjs(endAt).subtract(1, "year").toDate(),
        storeId,
      ),
      // Revenue by category
      this.dashboardRepository.getSalesRevenueByCategory(
        startAt,
        endAt,
        storeId,
      ),
      // Revenue by employee
      this.dashboardRepository.getSalesRevenueByEmployee(
        startAt,
        endAt,
        storeId,
      ),
      // Top products (SALE only)
      this.dashboardRepository.getOverviewTopProducts(
        startAt,
        endAt,
        storeId,
        10,
      ),
      // Top customers (SALE only)
      this.dashboardRepository.getTopCustomers(startAt, endAt, storeId, 5),
    ]);

    // Revenue by store (only for global view)
    const revenueByStore = !storeId
      ? await this.dashboardRepository.getSalesRevenueByStore(startAt, endAt)
      : [];

    // Map revenueByEmployee to topEmployees (top 5)
    const topEmployees = revenueByEmployee.slice(0, 5).map((emp) => ({
      id: emp.id,
      name: emp.name,
      code: emp.code,
      avatar: emp.avatar,
      revenue: emp.revenue,
      orders: emp.orders,
      avgOrderValue: emp.orders > 0 ? emp.revenue / emp.orders : 0,
    }));

    // Map revenueByStore to topStores (top 5)
    const topStores = revenueByStore.slice(0, 5).map((store) => ({
      id: store.id,
      name: store.name,
      code: store.code,
      image: store.image,
      revenue: store.revenue,
      orders: store.orders,
    }));

    // Helper function to calculate growth
    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    // Build sales metrics with growth
    const salesMetrics: SalesMetrics = {
      // === DOANH THU BÁN HÀNG (không bao gồm thuế) ===
      totalRevenue: currentMetrics.totalRevenue,
      revenueGrowth: calcGrowth(
        currentMetrics.totalRevenue,
        previousMetrics.totalRevenue,
      ),

      // === DOANH THU CÓ THUẾ ===
      totalRevenueWithTax: currentMetrics.totalRevenueWithTax,
      revenueWithTaxGrowth: calcGrowth(
        currentMetrics.totalRevenueWithTax,
        previousMetrics.totalRevenueWithTax,
      ),

      // === THUẾ VAT ===
      totalSalesTax: currentMetrics.totalSalesTax,
      salesTaxGrowth: calcGrowth(
        currentMetrics.totalSalesTax,
        previousMetrics.totalSalesTax,
      ),

      // === GIÁ VỐN ===
      totalCost: currentMetrics.totalCost,
      costGrowth: calcGrowth(
        currentMetrics.totalCost,
        previousMetrics.totalCost,
      ),

      // === LỢI NHUẬN GỘP ===
      grossProfit: currentMetrics.grossProfit,
      grossProfitGrowth: calcGrowth(
        currentMetrics.grossProfit,
        previousMetrics.grossProfit,
      ),
      grossProfitMargin: currentMetrics.grossProfitMargin,

      // === ĐƠN HÀNG ===
      totalOrders: currentMetrics.totalOrders,
      orderGrowth: calcGrowth(
        currentMetrics.totalOrders,
        previousMetrics.totalOrders,
      ),

      avgOrderValue: currentMetrics.avgOrderValue,
      avgOrderValueGrowth: calcGrowth(
        currentMetrics.avgOrderValue,
        previousMetrics.avgOrderValue,
      ),

      // === GIẢM GIÁ ===
      totalDiscount: currentMetrics.totalDiscount,
      discountGrowth: calcGrowth(
        currentMetrics.totalDiscount,
        previousMetrics.totalDiscount,
      ),

      discountRate: currentMetrics.discountRate,
    };

    // Build response data
    const data: DashboardSalesData = {
      metrics: salesMetrics,
      revenueByDate,
      revenueByDateLastYear,
      topProducts,
      topStores,
      topEmployees,
      topCustomers,
      revenueByCategory,
      revenueByEmployee,
      revenueByStore,
    };

    return ApiResponseHandler.getSuccess(
      "Sales report loaded successfully",
      data,
    );
  }

  async getProductReport(
    query: DashboardQueryDto,
  ): Promise<ApiResponse<DashboardProductData>> {
    const {
      startAt = dayjs().startOf("month").toDate(),
      endAt = dayjs().endOf("month").toDate(),
      storeId,
    } = query;

    const days = dayjs(endAt).diff(dayjs(startAt), "day") + 1;
    const startAtPrev = dayjs(startAt).subtract(days, "day").toDate();
    const endAtPrev = startAt;

    const [
      currentMetrics,
      previousMetrics,
      revenueByDate,
      topSellingProducts,
      lowStockProducts,
      deadStockProducts,
      revenueByCategory,
    ] = await Promise.all([
      this.dashboardRepository.getProductMetrics(startAt, endAt, storeId),
      this.dashboardRepository.getProductMetrics(
        startAtPrev,
        endAtPrev,
        storeId,
      ),
      this.dashboardRepository.getSalesRevenueByDate(startAt, endAt, storeId),
      this.dashboardRepository.getTopSellingProducts(
        startAt,
        endAt,
        storeId,
        10,
      ),
      this.dashboardRepository.getLowStockProducts(endAt, 10, storeId),
      this.dashboardRepository.getDeadStockProducts(
        startAt,
        endAt,
        10,
        storeId,
      ),
      this.dashboardRepository.getSalesRevenueByCategory(
        startAt,
        endAt,
        storeId,
      ),
    ]);

    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    const data: DashboardProductData = {
      metrics: {
        totalProducts: currentMetrics.totalProducts,
        productGrowth: calcGrowth(
          currentMetrics.totalProducts,
          previousMetrics.totalProducts,
        ),
        newProducts: currentMetrics.newProducts,
        newProductGrowth: calcGrowth(
          currentMetrics.newProducts,
          previousMetrics.newProducts,
        ),
        totalSellingProducts: currentMetrics.totalSellingProducts,
        sellingProductGrowth: calcGrowth(
          currentMetrics.totalSellingProducts,
          previousMetrics.totalSellingProducts,
        ),
        totalPurchasedProducts: currentMetrics.totalPurchasedProducts,
        purchasedProductGrowth: calcGrowth(
          currentMetrics.totalPurchasedProducts,
          previousMetrics.totalPurchasedProducts,
        ),
        totalEndingInventory: currentMetrics.totalEndingInventory,
        endingInventoryGrowth: calcGrowth(
          currentMetrics.totalEndingInventory,
          previousMetrics.totalEndingInventory,
        ),
        totalEndingInventoryValue: currentMetrics.totalEndingInventoryValue,
        endingInventoryValueGrowth: calcGrowth(
          currentMetrics.totalEndingInventoryValue,
          previousMetrics.totalEndingInventoryValue,
        ),
        totalInventoryAdjustment: currentMetrics.totalInventoryAdjustment,
        inventoryAdjustmentGrowth: calcGrowth(
          currentMetrics.totalInventoryAdjustment,
          previousMetrics.totalInventoryAdjustment,
        ),
        totalInventoryAdjustmentValue:
          currentMetrics.totalInventoryAdjustmentValue,
        inventoryAdjustmentValueGrowth: calcGrowth(
          currentMetrics.totalInventoryAdjustmentValue,
          previousMetrics.totalInventoryAdjustmentValue,
        ),
      },
      revenueByDate,
      topSellingProducts,
      lowStockProducts,
      deadStockProducts,
      revenueByCategory,
    };

    return ApiResponseHandler.getSuccess(
      "Product report loaded successfully",
      data,
    );
  }

  async getProductDetailReport(
    productId: string,
    query: DashboardQueryDto,
  ): Promise<ApiResponse<DashboardDetailProductData>> {
    const {
      startAt = dayjs().startOf("month").toDate(),
      endAt = dayjs().endOf("month").toDate(),
      storeId,
    } = query;

    const days = dayjs(endAt).diff(dayjs(startAt), "day") + 1;
    const startAtPrev = dayjs(startAt).subtract(days, "day").toDate();
    const endAtPrev = startAt;

    const [
      product,
      currentMetrics,
      previousMetrics,
      revenueByDate,
      soldOrders,
    ] = await Promise.all([
      this.dashboardRepository.getProductById(productId),
      this.dashboardRepository.getProductDetailMetrics(
        productId,
        startAt,
        endAt,
        storeId,
      ),
      this.dashboardRepository.getProductDetailMetrics(
        productId,
        startAtPrev,
        endAtPrev,
        storeId,
      ),
      this.dashboardRepository.getProductRevenueByDate(
        productId,
        startAt,
        endAt,
        storeId,
      ),
      this.dashboardRepository.getProductSoldOrders(
        productId,
        startAt,
        endAt,
        storeId,
        10,
      ),
    ]);

    if (!product) {
      throw new NotFoundError("product.not_found", {
        field: "id",
        code: ErrorsMessages.not_found,
      });
    }

    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    const metrics = {
      ...currentMetrics,
      revenueGrowth: calcGrowth(
        currentMetrics.totalRevenue,
        previousMetrics.totalRevenue,
      ),
      quantitySoldGrowth: calcGrowth(
        currentMetrics.totalQuantitySold,
        previousMetrics.totalQuantitySold,
      ),
      costGrowth: calcGrowth(
        currentMetrics.totalCost,
        previousMetrics.totalCost,
      ),
      grossProfitGrowth: calcGrowth(
        currentMetrics.grossProfit,
        previousMetrics.grossProfit,
      ),
      soldOrderGrowth: calcGrowth(
        currentMetrics.totalSoldOrders,
        previousMetrics.totalSoldOrders,
      ),
      returnedQuantityGrowth: calcGrowth(
        currentMetrics.returnedQuantity,
        previousMetrics.returnedQuantity,
      ),
      endingInventoryGrowth: calcGrowth(
        currentMetrics.endingInventory,
        previousMetrics.endingInventory,
      ),
      endingInventoryValueGrowth: calcGrowth(
        currentMetrics.endingInventoryValue,
        previousMetrics.endingInventoryValue,
      ),
    };

    const data: DashboardDetailProductData = {
      data: product,
      metrics,
      revenueByDate,
      soldOrders,
    };

    return ApiResponseHandler.getSuccess(
      "Product detail report loaded successfully",
      data,
    );
  }
}
