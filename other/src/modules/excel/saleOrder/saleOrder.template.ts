import ExcelJS from "exceljs";
import { SALE_ORDER_COLUMNS, OrderKey, OrderLineKey } from "./saleOrder.types";
import { injectable, inject } from "inversify";
import logger from "@/shared/utils/logger";
import { ORDER_TYPES, OrderService } from "@/modules/order";
import { Request } from "express";
import { ExportColumnConfig } from "../excel.types";
import { DiscountTypeEnum, OrderTypeEnum } from "@/shared/constants/enum";
import { TimezoneUtils } from "@/shared/utils/timezone.utils";

/**
 * Helper function để dịch DiscountType sang tiếng Việt
 */
function translateDiscountType(type: DiscountTypeEnum | string | null): string {
  if (!type) return "";
  if (type === DiscountTypeEnum.AMOUNT) return "Số tiền";
  if (type === DiscountTypeEnum.PERCENT) return "%";
  return type;
}

@injectable()
export class SaleOrderExcelTemplate {
  constructor(
    @inject(ORDER_TYPES.OrderService)
    private orderService: OrderService,
  ) {}
  /**
   * Tạo template Excel cho import đơn bán hàng
   */
  async generateTemplate(): Promise<ExcelJS.Workbook> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("SaleOrders");

      // Set up columns
      worksheet.columns = SALE_ORDER_COLUMNS.map((col) => ({
        header: col.header,
        key: col.field,
        width: col.width || 15,
      }));

      // Format header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 25;

      // Add border to header
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add sample data (2 lines for same order)
      const sampleRows = [
        {
          code: "DH001",
          partnerCode: "KH001",
          partnerName: "Nguyễn Văn A",
          partnerPhone: "0912345678",
          employeeCode: "NV001",
          employeeName: "Trần Văn B",
          orderAt: new Date(),
          discountType: "Số tiền",
          discountValue: 50000,
          shippingProviderCode: null,
          shippingFee: 30000,
          isFreeShipping: false,
          loyaltyPointsUsed: 0,
          productVariantCode: "SP001",
          productVariantName: "Áo thun basic",
          specification: "Size: M - Màu: Đỏ",
          unitPrice: 200000,
          quantity: 2,
          lineDiscountType: "%",
          lineDiscountValue: 10,
          taxRate: 10,
        },
        {
          code: "DH001",
          partnerCode: "KH001",
          partnerName: "Nguyễn Văn A",
          partnerPhone: "0912345678",
          employeeCode: "NV001",
          employeeName: "Trần Văn B",
          orderAt: new Date(),
          discountType: "Số tiền",
          discountValue: 50000,
          shippingProviderCode: null,
          shippingFee: 30000,
          isFreeShipping: false,
          loyaltyPointsUsed: 0,
          productVariantCode: "SP002",
          productVariantName: "Quần jean slim",
          specification: "Size: 30",
          unitPrice: 350000,
          quantity: 1,
          lineDiscountType: "Số tiền",
          lineDiscountValue: 20000,
          taxRate: 10,
        },
      ];

      sampleRows.forEach((row) => {
        worksheet.addRow(row);
      });

      // Format data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin", color: { argb: "FFD3D3D3" } },
              left: { style: "thin", color: { argb: "FFD3D3D3" } },
              bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
              right: { style: "thin", color: { argb: "FFD3D3D3" } },
            };
            cell.alignment = { vertical: "middle" };
          });
        }
      });

      // Add instructions sheet
      const instructionsSheet = workbook.addWorksheet("Hướng dẫn");
      instructionsSheet.columns = [
        { header: "Cột", key: "column", width: 30 },
        { header: "Mô tả", key: "description", width: 60 },
        { header: "Bắt buộc", key: "required", width: 12 },
      ];

      const instructions = [
        {
          column: "Mã đơn hàng",
          description:
            "Mã đơn hàng duy nhất. Các dòng có cùng mã sẽ được gộp thành 1 đơn",
          required: "Có",
        },
        {
          column: "Mã khách hàng",
          description: "Mã khách hàng đã tồn tại trong hệ thống",
          required: "Có",
        },
        {
          column: "Tên khách hàng",
          description: "Tên khách hàng (tham khảo, không bắt buộc)",
          required: "Không",
        },
        {
          column: "SĐT",
          description: "Số điện thoại khách hàng",
          required: "Không",
        },
        {
          column: "Mã nhân viên",
          description: "Mã nhân viên phụ trách đơn hàng",
          required: "Không",
        },
        {
          column: "Ngày đơn hàng",
          description: "Ngày thực hiện đơn hàng. Để trống sẽ lấy ngày hiện tại",
          required: "Không",
        },
        {
          column: "Loại giảm giá ĐH",
          description: "'Số tiền' hoặc '%'",
          required: "Không",
        },
        {
          column: "Giá trị giảm ĐH",
          description: "Giá trị giảm giá của đơn hàng (phân bổ xuống các dòng)",
          required: "Không",
        },
        {
          column: "Mã ĐVVC",
          description: "Mã nhà vận chuyển (nếu có)",
          required: "Không",
        },
        {
          column: "Phí vận chuyển",
          description: "Phí vận chuyển của đơn hàng",
          required: "Không",
        },
        {
          column: "Miễn phí VC",
          description: "TRUE/FALSE - miễn phí vận chuyển",
          required: "Không",
        },
        {
          column: "Điểm sử dụng",
          description: "Số điểm tích lũy khách hàng sử dụng trong đơn",
          required: "Không",
        },
        {
          column: "Mã sản phẩm/SKU",
          description: "Mã sản phẩm hoặc SKU của biến thể",
          required: "Có",
        },
        {
          column: "Tên sản phẩm",
          description: "Tên sản phẩm (tham khảo, không bắt buộc)",
          required: "Không",
        },
        {
          column: "Quy cách",
          description: "Quy cách của biến thể (VD: Size: M - Màu: Đỏ)",
          required: "Không",
        },
        {
          column: "Đơn giá",
          description: "Đơn giá bán của sản phẩm",
          required: "Có",
        },
        {
          column: "Số lượng",
          description: "Số lượng sản phẩm trong dòng",
          required: "Có",
        },
        {
          column: "Loại giảm giá dòng",
          description: "'Số tiền' hoặc '%' cho dòng",
          required: "Không",
        },
        {
          column: "Giá trị giảm dòng",
          description: "Giá trị giảm giá của dòng",
          required: "Không",
        },
        {
          column: "%VAT",
          description: "Thuế VAT (0, 8, 10, ...)",
          required: "Không",
        },
      ];

      instructions.forEach((inst) => {
        instructionsSheet.addRow(inst);
      });

      // Format instructions header
      const instHeaderRow = instructionsSheet.getRow(1);
      instHeaderRow.font = { bold: true };
      instHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2EFDA" },
      };

      logger.info("[SaleOrder Template] Generated template successfully");
      return workbook;
    } catch (error) {
      logger.error("[SaleOrder Template] Error generating template:", error);
      throw error;
    }
  }

  /**
   * Export dữ liệu Sale Orders sang Excel
   */
  async exportData(
    req: Request,
    columns: ExportColumnConfig[],
    filters?: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SaleOrders");

    // Setup columns
    const columnDefs =
      columns.length > 0
        ? columns.map((col) => ({
            header: col.header,
            key: col.field,
            width: col.width || 15,
          }))
        : SALE_ORDER_COLUMNS.map((col) => ({
            header: col.header,
            key: col.field,
            width: col.width || 15,
          }));

    worksheet.columns = columnDefs;

    // Format header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // Query sale orders with lines
    const response = await this.orderService.findAllWithPagination({
      ...filters,
      type: OrderTypeEnum.SALE,
      page: 1,
      size: 9_999_999,
    });
    const orders = response.data || [];

    // Convert orders to rows (mỗi line thành 1 row)
    for (const order of orders) {
      const lines = order.lines || [];

      for (const line of lines) {
        const variant = line.productVariantSnapshot;
        const specification = variant?.options
          ?.map((opt: any) => `${opt.typeName}: ${opt.value}`)
          .join(" - ");

        worksheet.addRow({
          // Order fields
          [OrderKey.CODE]: order.code,
          [OrderKey.PARTNER_CODE]: order.partnerSnapshot?.code || "",
          [OrderKey.PARTNER_NAME]: order.partnerSnapshot?.name || "",
          [OrderKey.PARTNER_PHONE]: order.partnerSnapshot?.phone || "",
          [OrderKey.EMPLOYEE_CODE]: order.employeeSnapshot?.code || "",
          [OrderKey.EMPLOYEE_NAME]: order.employeeSnapshot?.name || "",
          [OrderKey.ORDER_AT]: TimezoneUtils.utcToLocal(order.orderAt),
          [OrderKey.DISCOUNT_TYPE]: translateDiscountType(order.discountType),
          [OrderKey.DISCOUNT_VALUE]: order.discountValue || 0,
          [OrderKey.SHIPPING_PROVIDER_CODE]:
            order.shippingProviderSnapshot?.code || "",
          [OrderKey.SHIPPING_FEE]: order.shippingFee || 0,
          [OrderKey.IS_FREE_SHIPPING]: order.isFreeShipping || false,
          [OrderKey.LOYALTY_POINTS_USED]: order.loyaltyPointsUsed || 0,

          // Order calculated fields
          [OrderKey.GROSS_AMOUNT]: order.grossAmount || 0,
          [OrderKey.LINE_DISCOUNT_AMOUNT]: order.lineDiscountAmount || 0,
          [OrderKey.ORDER_DISCOUNT_AMOUNT]: order.orderDiscountAmount || 0,
          [OrderKey.NET_AMOUNT]: order.netAmount || 0,
          [OrderKey.TAX_AMOUNT]: order.taxAmount || 0,
          [OrderKey.TOTAL_AMOUNT]: order.totalAmount || 0,

          // Line fields
          [OrderLineKey.PRODUCT_VARIANT_CODE]: variant?.sku || "",
          [OrderLineKey.PRODUCT_VARIANT_NAME]: variant?.product?.name || "",
          [OrderLineKey.SPECIFICATION]: specification || "",
          [OrderLineKey.UNIT_PRICE]: line.unitPrice,
          [OrderLineKey.QUANTITY]: line.quantity,
          [OrderLineKey.LINE_DISCOUNT_TYPE]: translateDiscountType(
            line.discountType,
          ),
          [OrderLineKey.LINE_DISCOUNT_VALUE]: line.discountValue || 0,
          [OrderLineKey.TAX_RATE]: line.taxRate || 0,

          // Line calculated fields
          [OrderLineKey.SUB_TOTAL]: line.subTotal || 0,
          [OrderLineKey.DISCOUNT_AMOUNT]: line.discountAmount || 0,
          [OrderLineKey.ORDER_DISCOUNT_AMOUNT]: line.orderDiscountAmount || 0,
          [OrderLineKey.NET_AMOUNT]: line.netAmount || 0,
          [OrderLineKey.TAX_AMOUNT]: line.taxAmount || 0,
          [OrderLineKey.TOTAL_AMOUNT]: line.totalAmount || 0,
        });
      }
    }

    // Format number columns (use column index instead of key)
    // Find column indices for number formatting
    const numberFormatFields = [
      OrderKey.DISCOUNT_VALUE,
      OrderKey.SHIPPING_FEE,
      OrderKey.LOYALTY_POINTS_USED,
      OrderKey.GROSS_AMOUNT,
      OrderKey.LINE_DISCOUNT_AMOUNT,
      OrderKey.ORDER_DISCOUNT_AMOUNT,
      OrderKey.NET_AMOUNT,
      OrderKey.TAX_AMOUNT,
      OrderKey.TOTAL_AMOUNT,
      OrderLineKey.UNIT_PRICE,
      OrderLineKey.QUANTITY,
      OrderLineKey.LINE_DISCOUNT_VALUE,
      OrderLineKey.SUB_TOTAL,
      OrderLineKey.DISCOUNT_AMOUNT,
      OrderLineKey.ORDER_DISCOUNT_AMOUNT,
      OrderLineKey.NET_AMOUNT,
      OrderLineKey.TAX_AMOUNT,
      OrderLineKey.TOTAL_AMOUNT,
    ];

    numberFormatFields.forEach((field) => {
      const colIndex = SALE_ORDER_COLUMNS.findIndex(
        (col) => col.field === field,
      );
      if (colIndex !== -1) {
        worksheet.getColumn(colIndex + 1).numFmt = "#,##0";
      }
    });

    // Format date columns
    const dateColIndex = SALE_ORDER_COLUMNS.findIndex(
      (col) => col.field === OrderKey.ORDER_AT,
    );
    if (dateColIndex !== -1) {
      worksheet.getColumn(dateColIndex + 1).numFmt = "dd/mm/yyyy hh:mm";
    }

    // Auto-filter
    if (worksheet.columns.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length },
      };
    }

    // Format data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD3D3D3" } },
            left: { style: "thin", color: { argb: "FFD3D3D3" } },
            bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
            right: { style: "thin", color: { argb: "FFD3D3D3" } },
          };
          cell.alignment = { vertical: "middle" };
        });
      }
    });

    logger.info(
      `[SaleOrder Template] Exported ${orders.length} orders with ${worksheet.rowCount - 1} lines`,
    );
    return workbook;
  }
}
