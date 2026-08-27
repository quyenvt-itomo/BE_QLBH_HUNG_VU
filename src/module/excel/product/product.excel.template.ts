import { inject, injectable } from "inversify";
import ExcelJS from "exceljs";
import { RequestContext } from "@/shared/types/interfaces";
import { ProductService } from "@/module/product/product.service";
import { PRODUCT_TYPES } from "@/module/product/product.types";
import { ExportColumnConfig } from "../excel.types";
import { applyColumnFormats, formatHeader } from "../excel.dropdown";
import {
  PRODUCT_BUSINESS_STORE_COLUMNS,
  PRODUCT_COLUMNS,
  PRODUCT_EXTRA_UNIT_COLUMNS,
  PRODUCT_SHEET_NAMES,
} from "./product.excel.types";

@injectable()
export class ProductExcelTemplate {
  constructor(
    @inject(PRODUCT_TYPES.ProductService)
    private productService: ProductService,
  ) {}

  async generateTemplate(): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = this.createSheet(
      workbook,
      PRODUCT_SHEET_NAMES.MAIN,
      PRODUCT_COLUMNS,
    );
    sheet.addRow({
      code: "HH001",
      name: "Sản phẩm mẫu",
      barcode: "893000000001",
      groupName: "Nhóm hàng mẫu",
      brandName: "Thương hiệu mẫu",
      baseUnitName: "Cái",
      salePrice: 100000,
      weight: 1,
      weightUnit: "kg",
      description: "Dòng mẫu, có thể xóa trước khi nhập",
      note: "",
    });
    this.applyRowsValidation(sheet, PRODUCT_COLUMNS);

    const extraSheet = this.createSheet(
      workbook,
      PRODUCT_SHEET_NAMES.EXTRA_UNITS,
      PRODUCT_EXTRA_UNIT_COLUMNS,
    );
    extraSheet.addRow({
      productCode: "HH001",
      unitName: "Thùng",
      conversionRate: 12,
      salePrice: 1100000,
      isPurchaseUnit: "Có",
    });
    this.applyRowsValidation(extraSheet, PRODUCT_EXTRA_UNIT_COLUMNS);

    const businessStoreSheet = this.createSheet(
      workbook,
      PRODUCT_SHEET_NAMES.BUSINESS_STORES,
      PRODUCT_BUSINESS_STORE_COLUMNS,
    );
    this.applyRowsValidation(
      businessStoreSheet,
      PRODUCT_BUSINESS_STORE_COLUMNS,
    );

    const guide = workbook.addWorksheet(PRODUCT_SHEET_NAMES.GUIDE);
    guide.addRow(["HƯỚNG DẪN NHẬP HÀNG HÓA"]);
    guide.addRow(["Hàng hóa: mỗi dòng là một mã hàng hóa. Mã hàng hóa là bắt buộc."]);
    guide.addRow([
      "Đơn vị tính phụ: dùng mã hàng hóa ở sheet Hàng hóa để khai báo các đơn vị quy đổi.",
    ]);
    guide.addRow([
      "Cửa hàng kinh doanh: dùng mã hàng hóa và mã cửa hàng để khai báo giá vốn, trạng thái kinh doanh tại từng cửa hàng.",
    ]);
    guide.addRow([
      "Các cột Nhóm hàng hóa, Thương hiệu, Đơn vị tính sẽ tự tạo danh mục nếu chưa tồn tại.",
    ]);
    guide.getColumn(1).width = 110;
    guide.getRow(1).font = { bold: true, size: 14 };
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters?: Record<string, any>,
    extraUnitColumns?: ExportColumnConfig[],
    businessStoreColumns?: ExportColumnConfig[],
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const mainColumns = columns.length ? columns : PRODUCT_COLUMNS;
    const result = await this.productService.findAllWithPagination(
      {
        ...(filters || {}),
        page: 1,
        size: 1000000,
        useFullDetail: true,
      } as any,
      undefined,
      req,
    );
    const products = result.data || [];
    const sheet = this.createSheet(
      workbook,
      PRODUCT_SHEET_NAMES.MAIN,
      mainColumns,
    );
    const productRowMap = new Map<string, number>();
    products.forEach((product, index) => {
      sheet.addRow(this.productRow(product));
      productRowMap.set(product.code, index + 2);
    });
    applyColumnFormats(sheet, mainColumns);

    const extraColumns =
      extraUnitColumns && extraUnitColumns.length
        ? extraUnitColumns
        : PRODUCT_EXTRA_UNIT_COLUMNS;
    const extraSheet = this.createSheet(
      workbook,
      PRODUCT_SHEET_NAMES.EXTRA_UNITS,
      extraColumns,
    );
    products.forEach((product) => {
      (product.extraUnits || []).forEach((extraUnit) => {
        const row = extraSheet.addRow({
          productCode: product.code,
          unitName: extraUnit.unit?.name || "",
          conversionRate: extraUnit.conversionRate,
          salePrice: extraUnit.salePrice,
          isPurchaseUnit: extraUnit.isPurchaseUnit ? "Có" : "Không",
        });
        const mainRow = productRowMap.get(product.code);
        if (mainRow) {
          row.getCell(1).value = {
            text: product.code,
            hyperlink: "#'" + PRODUCT_SHEET_NAMES.MAIN + "'!A" + mainRow,
          };
        }
      });
    });
    applyColumnFormats(extraSheet, extraColumns);

    const storeColumns =
      businessStoreColumns && businessStoreColumns.length
        ? businessStoreColumns
        : PRODUCT_BUSINESS_STORE_COLUMNS;
    const businessStoreSheet = this.createSheet(
      workbook,
      PRODUCT_SHEET_NAMES.BUSINESS_STORES,
      storeColumns,
    );
    products.forEach((product) => {
      (product.storeProducts || []).forEach((storeProduct: any) => {
        const row = businessStoreSheet.addRow({
          productCode: product.code,
          storeCode: storeProduct.store?.code || "",
          storeName: storeProduct.store?.name || "",
          costPrice: storeProduct.costPrice,
          isSelling: storeProduct.isSelling ? "Có" : "Không",
        });
        const mainRow = productRowMap.get(product.code);
        if (mainRow) {
          row.getCell(1).value = {
            text: product.code,
            hyperlink: "#'" + PRODUCT_SHEET_NAMES.MAIN + "'!A" + mainRow,
          };
        }
      });
    });
    applyColumnFormats(businessStoreSheet, storeColumns);
    return workbook;
  }

  private createSheet(
    workbook: ExcelJS.Workbook,
    name: string,
    columns: ExportColumnConfig[],
  ): ExcelJS.Worksheet {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns.map((column) => ({
      header: column.header,
      key: column.field,
      width: column.width || 15,
      ...(column.numberFormat
        ? { style: { numFmt: column.numberFormat } }
        : {}),
    }));
    formatHeader(sheet.getRow(1));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    if (columns.length) {
      sheet.autoFilter = {
        from: "A1",
        to: String.fromCharCode(64 + columns.length) + "1",
      };
    }
    return sheet;
  }

  private applyRowsValidation(
    sheet: ExcelJS.Worksheet,
    columns: ExportColumnConfig[],
  ): void {
    columns.forEach((column, index) => {
      if (!column.options?.length) return;
      for (let row = 2; row <= 200; row++) {
        sheet.getCell(row, index + 1).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"' + column.options.join(",") + '"'],
        };
      }
    });
  }

  private productRow(product: any): Record<string, any> {
    return {
      code: product.code,
      name: product.name,
      barcode: product.barcode || "",
      groupName: product.group?.name || "",
      brandName: product.brand?.name || "",
      baseUnitName: product.baseUnit?.name || "",
      salePrice: product.salePrice,
      weight: product.weight,
      weightUnit: product.weightUnit || "",
      description: product.description || "",
      note: product.note || "",
    };
  }
}
