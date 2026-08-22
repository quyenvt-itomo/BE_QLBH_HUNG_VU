import ExcelJS from "exceljs";
import { injectable, inject } from "inversify";
import { Request } from "express";
import { ExportColumnConfig } from "../excel.types";
import {
  SalesSheetKey,
  ProfitSheetKey,
  SALES_SHEET_COLUMNS,
  PROFIT_SHEET_COLUMNS,
  SalesDailyRow,
  ProfitDailyRow,
  DashboardExportFilters,
} from "./dashboard.types";
import { DASHBOARD_TYPES, DashboardRepository } from "@/modules/dashboard";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import logger from "@/shared/utils/logger";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Dashboard Excel Template
 * Xuất báo cáo bán hàng và lợi nhuận theo ngày
 */
@injectable()
export class DashboardExcelTemplate {
  constructor(
    @inject(DASHBOARD_TYPES.DashboardRepository)
    private dashboardRepository: DashboardRepository,
  ) {}

  /**
   * Export dữ liệu dashboard ra Excel với 2 sheet: Bán hàng và Lợi nhuận
   */
  async exportData(
    _req: Request,
    _columns: ExportColumnConfig[],
    filters?: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const {
      storeId,
      startAt,
      endAt,
      timezone: tz = DEFAULT_TIMEZONE,
    } = (filters || {}) as DashboardExportFilters;

    // Parse dates với timezone
    const startDate = dayjs(startAt).tz(tz).startOf("day").toDate();
    const endDate = dayjs(endAt).tz(tz).endOf("day").toDate();

    logger.info(
      `[Dashboard Excel] Exporting from ${startAt} to ${endAt}, timezone: ${tz}, storeId: ${storeId || "all"}`,
    );

    // Lấy dữ liệu song song
    const [salesDetail, profitDetail] = await Promise.all([
      this.dashboardRepository.getDailySalesDetail(startDate, endDate, storeId),
      this.dashboardRepository.getDailyProfitDetail(
        startDate,
        endDate,
        storeId,
      ),
    ]);

    // Build workbook
    const workbook = new ExcelJS.Workbook();

    // ========== Sheet 1: Bán hàng ==========
    this.buildSalesSheet(workbook, salesDetail);

    // ========== Sheet 2: Lợi nhuận ==========
    this.buildProfitSheet(workbook, profitDetail);

    logger.info(
      `[Dashboard Excel] Exported ${salesDetail.length} days of data`,
    );

    return workbook;
  }

  /**
   * Build sheet Bán hàng
   */
  private buildSalesSheet(
    workbook: ExcelJS.Workbook,
    data: Awaited<ReturnType<DashboardRepository["getDailySalesDetail"]>>,
  ): void {
    const worksheet = workbook.addWorksheet("Bán hàng");

    // Setup columns
    worksheet.columns = SALES_SHEET_COLUMNS.map((col) => ({
      header: col.header,
      key: col.field,
      width: col.width || 15,
    }));

    // Format header row
    this.formatHeaderRow(worksheet.getRow(1));

    // Add data rows
    const rows: SalesDailyRow[] = data.map((d) => {
      const grossProfit = d.netAmount - d.cost;
      const grossProfitMargin =
        d.netAmount > 0 ? (grossProfit / d.netAmount) * 100 : 0;

      return {
        date: d.date,
        orderCount: d.orderCount,
        grossAmount: d.grossAmount,
        lineDiscount: d.lineDiscount,
        orderDiscount: d.orderDiscount,
        netAmount: d.netAmount,
        shippingFee: d.shippingFee,
        taxAmount: d.taxAmount,
        totalAmount: d.totalAmount,
        grossProfit: grossProfit,
        grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
      };
    });

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Add tổng row
    const totals = this.calculateSalesTotals(rows);
    const totalRow = worksheet.addRow(totals);
    this.formatTotalRow(totalRow);

    // Format number columns
    this.formatNumberColumns(
      worksheet,
      SALES_SHEET_COLUMNS,
      [
        SalesSheetKey.ORDER_COUNT,
        SalesSheetKey.GROSS_AMOUNT,
        SalesSheetKey.LINE_DISCOUNT,
        SalesSheetKey.ORDER_DISCOUNT,
        SalesSheetKey.NET_AMOUNT,
        SalesSheetKey.SHIPPING_FEE,
        SalesSheetKey.TAX_AMOUNT,
        SalesSheetKey.TOTAL_AMOUNT,
        SalesSheetKey.GROSS_PROFIT,
      ],
      "#,##0",
    );

    // Format percentage column
    const marginColIndex =
      SALES_SHEET_COLUMNS.findIndex(
        (col) => col.field === SalesSheetKey.GROSS_PROFIT_MARGIN,
      ) + 1;
    if (marginColIndex > 0) {
      worksheet.getColumn(marginColIndex).numFmt = '0.00"%"';
    }

    // Format data rows with border
    this.formatDataRows(worksheet);

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: SALES_SHEET_COLUMNS.length },
    };
  }

  /**
   * Build sheet Lợi nhuận
   */
  private buildProfitSheet(
    workbook: ExcelJS.Workbook,
    data: Awaited<ReturnType<DashboardRepository["getDailyProfitDetail"]>>,
  ): void {
    const worksheet = workbook.addWorksheet("Lợi nhuận");

    // Setup columns
    worksheet.columns = PROFIT_SHEET_COLUMNS.map((col) => ({
      header: col.header,
      key: col.field,
      width: col.width || 15,
    }));

    // Format header row
    this.formatHeaderRow(worksheet.getRow(1));

    // Add data rows
    const rows: ProfitDailyRow[] = data.map((d) => {
      const grossProfit = d.salesRevenue - d.cogs;
      const totalRevenue = d.salesRevenue + d.otherIncome;
      const totalExpense = d.cogs + d.shippingExpense + d.otherExpense;
      const totalAdjustments =
        d.inventoryAdjustment + d.partnerDebtAdjustment + d.fundAdjustment;
      const netProfit = totalRevenue - totalExpense + totalAdjustments;
      const netProfitMargin =
        totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      return {
        date: d.date,
        salesRevenue: d.salesRevenue,
        cogs: d.cogs,
        shippingExpense: d.shippingExpense,
        grossProfit: grossProfit,
        otherIncome: d.otherIncome,
        totalRevenue: totalRevenue,
        otherExpense: d.otherExpense,
        inventoryAdjustment: d.inventoryAdjustment,
        partnerDebtAdjustment: d.partnerDebtAdjustment,
        fundAdjustment: d.fundAdjustment,
        totalAdjustments: totalAdjustments,
        netProfit: netProfit,
        netProfitMargin: Math.round(netProfitMargin * 100) / 100,
      };
    });

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Add tổng row
    const totals = this.calculateProfitTotals(rows);
    const totalRow = worksheet.addRow(totals);
    this.formatTotalRow(totalRow);

    // Format number columns
    this.formatNumberColumns(
      worksheet,
      PROFIT_SHEET_COLUMNS,
      [
        ProfitSheetKey.SALES_REVENUE,
        ProfitSheetKey.COGS,
        ProfitSheetKey.SHIPPING_EXPENSE,
        ProfitSheetKey.GROSS_PROFIT,
        ProfitSheetKey.OTHER_INCOME,
        ProfitSheetKey.TOTAL_REVENUE,
        ProfitSheetKey.OTHER_EXPENSE,
        ProfitSheetKey.INVENTORY_ADJUSTMENT,
        ProfitSheetKey.PARTNER_DEBT_ADJUSTMENT,
        ProfitSheetKey.FUND_ADJUSTMENT,
        ProfitSheetKey.TOTAL_ADJUSTMENTS,
        ProfitSheetKey.NET_PROFIT,
      ],
      "#,##0",
    );

    // Format percentage column
    const marginColIndex =
      PROFIT_SHEET_COLUMNS.findIndex(
        (col) => col.field === ProfitSheetKey.NET_PROFIT_MARGIN,
      ) + 1;
    if (marginColIndex > 0) {
      worksheet.getColumn(marginColIndex).numFmt = '0.00"%"';
    }

    // Format data rows with border
    this.formatDataRows(worksheet);

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: PROFIT_SHEET_COLUMNS.length },
    };
  }

  /**
   * Format header row với style chung
   */
  private formatHeaderRow(headerRow: ExcelJS.Row): void {
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  /**
   * Format dòng tổng (dòng cuối)
   */
  private formatTotalRow(totalRow: ExcelJS.Row): void {
    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF2CC" }, // Light yellow background
    };
    totalRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "medium" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle" };
      if (colNumber === 1) {
        cell.value = "Tổng";
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    });
  }

  /**
   * Format các cột số
   */
  private formatNumberColumns(
    worksheet: ExcelJS.Worksheet,
    columns: ExportColumnConfig[],
    numberFields: string[],
    numFmt: string,
  ): void {
    numberFields.forEach((field) => {
      const colIndex = columns.findIndex((col) => col.field === field);
      if (colIndex !== -1) {
        worksheet.getColumn(colIndex + 1).numFmt = numFmt;
      }
    });
  }

  /**
   * Format data rows với border
   */
  private formatDataRows(worksheet: ExcelJS.Worksheet): void {
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          // Chỉ thêm border nếu chưa có (dòng tổng đã có border riêng)
          if (!cell.border || !cell.border.top) {
            cell.border = {
              top: { style: "thin", color: { argb: "FFD3D3D3" } },
              left: { style: "thin", color: { argb: "FFD3D3D3" } },
              bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
              right: { style: "thin", color: { argb: "FFD3D3D3" } },
            };
          }
          cell.alignment = { vertical: "middle" };
        });
      }
    });
  }

  /**
   * Tính tổng cho sheet Bán hàng
   */
  private calculateSalesTotals(rows: SalesDailyRow[]): Record<string, any> {
    const totalNetAmount = rows.reduce((s, r) => s + r.netAmount, 0);
    const totalGrossProfit = rows.reduce((s, r) => s + r.grossProfit, 0);

    return {
      [SalesSheetKey.DATE]: "Tổng",
      [SalesSheetKey.ORDER_COUNT]: rows.reduce((s, r) => s + r.orderCount, 0),
      [SalesSheetKey.GROSS_AMOUNT]: rows.reduce((s, r) => s + r.grossAmount, 0),
      [SalesSheetKey.LINE_DISCOUNT]: rows.reduce(
        (s, r) => s + r.lineDiscount,
        0,
      ),
      [SalesSheetKey.ORDER_DISCOUNT]: rows.reduce(
        (s, r) => s + r.orderDiscount,
        0,
      ),
      [SalesSheetKey.NET_AMOUNT]: totalNetAmount,
      [SalesSheetKey.SHIPPING_FEE]: rows.reduce((s, r) => s + r.shippingFee, 0),
      [SalesSheetKey.TAX_AMOUNT]: rows.reduce((s, r) => s + r.taxAmount, 0),
      [SalesSheetKey.TOTAL_AMOUNT]: rows.reduce((s, r) => s + r.totalAmount, 0),
      [SalesSheetKey.GROSS_PROFIT]: totalGrossProfit,
      [SalesSheetKey.GROSS_PROFIT_MARGIN]:
        totalNetAmount > 0
          ? Math.round((totalGrossProfit / totalNetAmount) * 10000) / 100
          : 0,
    };
  }

  /**
   * Tính tổng cho sheet Lợi nhuận
   */
  private calculateProfitTotals(rows: ProfitDailyRow[]): Record<string, any> {
    const totalSalesRevenue = rows.reduce((s, r) => s + r.salesRevenue, 0);
    const totalOtherIncome = rows.reduce((s, r) => s + r.otherIncome, 0);
    const totalRevenue = rows.reduce((s, r) => s + r.totalRevenue, 0);
    const totalCogs = rows.reduce((s, r) => s + r.cogs, 0);
    const totalShippingExpense = rows.reduce(
      (s, r) => s + r.shippingExpense,
      0,
    );
    const totalOtherExpense = rows.reduce((s, r) => s + r.otherExpense, 0);
    const totalInventoryAdj = rows.reduce(
      (s, r) => s + r.inventoryAdjustment,
      0,
    );
    const totalDebtAdj = rows.reduce((s, r) => s + r.partnerDebtAdjustment, 0);
    const totalFundAdj = rows.reduce((s, r) => s + r.fundAdjustment, 0);
    const totalAdjustments = totalInventoryAdj + totalDebtAdj + totalFundAdj;
    const totalGrossProfit = totalSalesRevenue - totalCogs;
    const totalNetProfit = rows.reduce((s, r) => s + r.netProfit, 0);
    const totalNetProfitMargin =
      totalRevenue > 0
        ? Math.round((totalNetProfit / totalRevenue) * 10000) / 100
        : 0;

    return {
      [ProfitSheetKey.DATE]: "Tổng",
      [ProfitSheetKey.SALES_REVENUE]: totalSalesRevenue,
      [ProfitSheetKey.COGS]: totalCogs,
      [ProfitSheetKey.SHIPPING_EXPENSE]: totalShippingExpense,
      [ProfitSheetKey.GROSS_PROFIT]: totalGrossProfit,
      [ProfitSheetKey.OTHER_INCOME]: totalOtherIncome,
      [ProfitSheetKey.TOTAL_REVENUE]: totalRevenue,
      [ProfitSheetKey.OTHER_EXPENSE]: totalOtherExpense,
      [ProfitSheetKey.INVENTORY_ADJUSTMENT]: totalInventoryAdj,
      [ProfitSheetKey.PARTNER_DEBT_ADJUSTMENT]: totalDebtAdj,
      [ProfitSheetKey.FUND_ADJUSTMENT]: totalFundAdj,
      [ProfitSheetKey.TOTAL_ADJUSTMENTS]: totalAdjustments,
      [ProfitSheetKey.NET_PROFIT]: totalNetProfit,
      [ProfitSheetKey.NET_PROFIT_MARGIN]: totalNetProfitMargin,
    };
  }
}
