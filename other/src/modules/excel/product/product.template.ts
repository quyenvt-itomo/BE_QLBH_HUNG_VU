import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import { PRODUCT_TYPES, ProductService } from "@/modules/product";
import { Request } from "express";
import { PRODUCT_COLUMNS, ProductKey } from "./product.types";
import {
  getProductCategoryContent,
  getVariantOptionContent,
} from "@/shared/utils/utils";
import logger from "@/shared/utils/logger";

/**
 * Product Excel Template Generator
 * Cấu trúc mới: mỗi dòng độc lập
 * - Có SPECIFICATION => variant của product
 * - Không có SPECIFICATION => product với variant default
 */
@injectable()
export class ProductExcelTemplate {
  constructor(
    @inject(PRODUCT_TYPES.ProductService)
    private productService: ProductService,
  ) {}

  /**
   * Tạo template Excel rỗng cho import Product
   */
  async generateTemplate(): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Products");

    // Setup columns
    worksheet.columns = PRODUCT_COLUMNS.map((col) => ({
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

    // Add sample data
    const sampleRows = [
      {
        code: "SP001",
        name: "Áo thun basic",
        categoryName: "Áo",
        unitName: "Cái",
        taxRate: 10,
        specification: null, // Không có spec => product đơn giản
        sku: null,
        barcode: "1234567890",
        variantCostPrice: 100000,
        variantPrice: 200000,
        note: "Áo thun cotton",
      },
      {
        code: "SP002",
        name: "Quần jean",
        categoryName: "Quần",
        unitName: "Cái",
        taxRate: 10,
        specification: "Size: 28 - Màu: Xanh",
        sku: "SP002-28-XANH",
        barcode: "1234567891",
        variantCostPrice: 200000,
        variantPrice: 350000,
        note: "Quần jean slim fit",
      },
      {
        code: "SP002",
        name: "Quần jean",
        categoryName: "Quần",
        unitName: "Cái",
        taxRate: 10,
        specification: "Size: 30 - Màu: Đen",
        sku: "SP002-30-DEN",
        barcode: "1234567892",
        variantCostPrice: 200000,
        variantPrice: 350000,
        note: "Quần jean slim fit",
      },
    ];

    sampleRows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Format data rows with borders
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
    this.addInstructions(workbook);

    logger.info("[Product Template] Generated template successfully");
    return workbook;
  }

  /**
   * Export dữ liệu Product sang Excel (new structure)
   */
  async exportData(
    req: Request,
    columns: ExportColumnConfig[],
    filters?: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Products");

    // Setup columns
    worksheet.columns = PRODUCT_COLUMNS.map((col) => ({
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

    // Lấy dữ liệu products với filters
    const products = (
      await this.productService.findAllWithPagination({
        ...filters,
        size: 100000,
      })
    ).data;

    // Convert products to rows - mỗi variant một dòng
    for (const product of products) {
      const baseData = {
        code: product.code,
        name: product.name,
        categoryName: getProductCategoryContent(product.category),
        unitName: product.unit?.name || "",
        taxRate: product.taxRate || null,
        note: product.note || null,
      };

      if (!product.hasVariant) {
        // Product đơn giản (không có variant)
        const variant = product.variants?.[0];
        worksheet.addRow({
          ...baseData,
          specification: null,
          sku: variant?.sku || null,
          barcode: variant?.barcode || null,
          variantCostPrice: variant?.costPrice || null,
          variantPrice: variant?.price || null,
        });
      } else {
        // Product có nhiều variants - mỗi variant một dòng
        for (const variant of product.variants || []) {
          // if (!variant.isActive) continue;

          const specContent = getVariantOptionContent({
            ...variant,
            product: product,
          } as any);

          worksheet.addRow({
            ...baseData,
            specification: specContent || null,
            sku: variant.sku || null,
            barcode: variant.barcode || null,
            variantCostPrice: variant.costPrice || null,
            variantPrice: variant.price || null,
          });
        }
      }
    }

    // Format number columns
    const numberColumns = [
      ProductKey.TAX_RATE,
      ProductKey.VARIANT_COST_PRICE,
      ProductKey.VARIANT_PRICE,
    ];
    numberColumns.forEach((key) => {
      const colIndex = PRODUCT_COLUMNS.findIndex((col) => col.field === key);
      if (colIndex !== -1) {
        worksheet.getColumn(colIndex + 1).numFmt = "#,##0";
      }
    });

    logger.info(`[Product Template] Exported ${products.length} products`);
    return workbook;
  }

  /**
   * Thêm sheet hướng dẫn
   */
  private addInstructions(workbook: ExcelJS.Workbook): void {
    const instructionsSheet = workbook.addWorksheet("Hướng dẫn");
    instructionsSheet.columns = [
      { header: "Cột", key: "column", width: 30 },
      { header: "Mô tả", key: "description", width: 60 },
      { header: "Bắt buộc", key: "required", width: 12 },
    ];

    const instructions = [
      {
        column: "Mã sản phẩm",
        description:
          "Mã sản phẩm duy nhất. Các dòng có cùng mã sẽ là các variant của cùng 1 sản phẩm",
        required: "Có",
      },
      {
        column: "Tên sản phẩm",
        description: "Tên sản phẩm",
        required: "Có",
      },
      {
        column: "Danh mục",
        description: "Tên danh mục sản phẩm",
        required: "Không",
      },
      {
        column: "ĐVT",
        description: "Đơn vị tính",
        required: "Không",
      },
      {
        column: "%VAT",
        description: "Thuế VAT (0, 8, 10, ...)",
        required: "Không",
      },
      {
        column: "Quy cách",
        description:
          "Quy cách của biến thể (VD: Size: M - Màu: Đỏ). Để trống nếu sản phẩm không có biến thể",
        required: "Không",
      },
      {
        column: "Mã SKU",
        description: "Mã SKU của biến thể (tự động sinh nếu để trống)",
        required: "Không",
      },
      {
        column: "Mã vạch",
        description: "Mã vạch của sản phẩm/biến thể",
        required: "Không",
      },
      {
        column: "Giá vốn",
        description: "Giá vốn của sản phẩm/biến thể",
        required: "Không",
      },
      {
        column: "Giá bán",
        description: "Giá bán của sản phẩm/biến thể",
        required: "Không",
      },
      {
        column: "Mô tả",
        description: "Mô tả chi tiết về sản phẩm",
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
  }
}
