import { inject, injectable } from "inversify";
import ExcelJS from "exceljs";
import { DeepPartial } from "typeorm";
import { Product, WeightUnit } from "@/database/models/Product";
import { AttributeType } from "@/database/models/Attribute";
import { ProductService } from "@/module/product/product.service";
import { PRODUCT_TYPES } from "@/module/product/product.types";
import { AttributeRepository } from "@/module/attribute/attribute.repository";
import { ATTRIBUTE_TYPES } from "@/module/attribute/attribute.types";
import { StoreRepository } from "@/module/store/store.repository";
import { STORE_TYPES } from "@/module/store/store.types";
import { RequestContext } from "@/shared/types/interfaces";
import { BadRequestError } from "@/shared/types/errors";
import {
  ImportDuplicateHandling,
  ImportErrorHandling,
  ImportOptions,
  ImportProgressCallback,
  ImportResult,
} from "../excel.types";
import {
  PRODUCT_SHEET_NAMES,
  PRODUCT_GROUP_PATH_SEPARATOR,
  RawBusinessStoreRow,
  RawExtraUnitRow,
  RawProductRow,
} from "./product.excel.types";

@injectable()
export class ProductExcelProcessor {
  constructor(
    @inject(PRODUCT_TYPES.ProductService)
    private productService: ProductService,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
    @inject(STORE_TYPES.StoreRepository)
    private storeRepository: StoreRepository,
  ) {}

  async processImport(
    req: RequestContext,
    workbook: ExcelJS.Workbook,
    options: ImportOptions,
    onProgress?: ImportProgressCallback,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      skippedRows: 0,
      errors: [],
      data: [],
    };
    const sheet = workbook.getWorksheet(PRODUCT_SHEET_NAMES.MAIN);
    if (!sheet) {
      throw new BadRequestError(
        "Không tìm thấy sheet '" + PRODUCT_SHEET_NAMES.MAIN + "'",
      );
    }

    const rows = this.parseProducts(sheet);
    const extraUnits = this.parseExtraUnits(
      workbook.getWorksheet(PRODUCT_SHEET_NAMES.EXTRA_UNITS),
    );
    const businessStores = this.parseBusinessStores(
      workbook.getWorksheet(PRODUCT_SHEET_NAMES.BUSINESS_STORES),
    );
    result.totalRows = rows.length;
    this.report(result, onProgress);

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;
      try {
        if (!row.name) throw new Error("Tên hàng hóa không được để trống");
        const existing = await this.productService.findOne({
          where: { code: row.code },
        });
        if (existing) {
          if (options.duplicateHandling === ImportDuplicateHandling.SKIP) {
            result.skippedRows++;
            this.report(result, onProgress);
            continue;
          }
          if (options.duplicateHandling === ImportDuplicateHandling.STOP) {
            throw new Error('Mã hàng hóa "' + row.code + '" đã tồn tại');
          }
        }

        const data: DeepPartial<Product> = {
          code: row.code,
          name: row.name,
          barcode: row.barcode || null,
          description: row.description || null,
          note: row.note || null,
          groupId: await this.findAttribute(
            row.groupName,
            AttributeType.PRODUCT_GROUP,
            req,
          ),
          brandId: await this.findAttribute(row.brandName, AttributeType.BRAND, req),
          baseUnitId: await this.findAttribute(
            row.baseUnitName,
            AttributeType.UNIT,
            req,
          ),
          salePrice: this.optionalNumber(row.salePrice, "Giá bán", rowNumber),
          weight: this.optionalNumber(row.weight, "Trọng lượng", rowNumber),
          weightUnit: this.parseWeightUnit(row.weightUnit, rowNumber),
        };

        const productBusinessStores = businessStores.get(row.code);
        if (productBusinessStores) {
          const storeProducts = [];
          const storeIds = new Set<string>();
          for (const storeRow of productBusinessStores) {
            if (!storeRow.storeCode) {
              throw new Error(
                'Hàng hóa "' + row.code + '": mã cửa hàng không được để trống',
              );
            }
            const store = await this.storeRepository.findOne({
              where: { code: storeRow.storeCode } as any,
            });
            if (!store) {
              throw new Error(
                'Hàng hóa "' +
                  row.code +
                  '": không tìm thấy cửa hàng "' +
                  storeRow.storeCode +
                  '"',
              );
            }
            if (
              req.storeContext?.storeId &&
              req.storeContext.storeId !== store.id
            ) {
              throw new Error(
                'Hàng hóa "' +
                  row.code +
                  '": cửa hàng "' +
                  storeRow.storeCode +
                  '" không thuộc phạm vi hiện tại',
              );
            }
            if (storeIds.has(store.id)) {
              throw new Error(
                'Hàng hóa "' +
                  row.code +
                  '": không được khai báo trùng cửa hàng "' +
                  storeRow.storeCode +
                  '"',
              );
            }
            storeIds.add(store.id);
            const costPrice = this.optionalNumber(
              storeRow.costPrice,
              "Giá vốn",
              rowNumber,
            );
            storeProducts.push({
              storeId: store.id,
              costPrice: costPrice ?? 0,
              isSelling: storeRow.isSelling,
            });
          }
          (data as any).storeProducts = storeProducts;
        }

        const productExtraUnits = extraUnits.get(row.code);
        if (productExtraUnits) {
          (data as any).extraUnits = [];
          for (const extra of productExtraUnits) {
            if (!extra.unitName) {
              throw new Error(
                'Hàng hóa "' + row.code + '": tên đơn vị tính phụ không được để trống',
              );
            }
            if (
              !Number.isFinite(extra.conversionRate) ||
              extra.conversionRate <= 0
            ) {
              throw new Error(
                'Hàng hóa "' + row.code + '": tỷ lệ quy đổi phải lớn hơn 0',
              );
            }
            if (!Number.isFinite(extra.salePrice) || extra.salePrice < 0) {
              throw new Error(
                'Hàng hóa "' + row.code + '": giá bán đơn vị phụ không hợp lệ',
              );
            }
            const unitId = await this.attributeRepository.findOrCreateAttribute(
              { name: extra.unitName, type: AttributeType.UNIT },
              req,
            );
            (data as any).extraUnits.push({
              unitId,
              conversionRate: extra.conversionRate,
              salePrice: extra.salePrice,
              isPurchaseUnit: extra.isPurchaseUnit,
            });
          }
        }

        const saved = existing
          ? await this.productService.update(existing.id, data, undefined, req)
          : await this.productService.create(data, undefined, req);
        result.successRows++;
        result.data.push(saved);
        this.report(result, onProgress);
      } catch (error: any) {
        result.errorRows++;
        result.errors.push({
          row: rowNumber,
          message: error?.message || "Dòng dữ liệu không hợp lệ",
          data: row as any,
        });
        this.report(result, onProgress);
        if (options.errorHandling === ImportErrorHandling.STOP_ON_ERROR) break;
      }
    }
    return result;
  }

  private parseProducts(sheet: ExcelJS.Worksheet): RawProductRow[] {
    const rows: RawProductRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const code = this.text(row.getCell(1).value);
      if (!code) return;
      rows.push({
        code,
        name: this.text(row.getCell(2).value),
        barcode: this.text(row.getCell(3).value) || undefined,
        groupName: this.text(row.getCell(4).value) || undefined,
        brandName: this.text(row.getCell(5).value) || undefined,
        baseUnitName: this.text(row.getCell(6).value) || undefined,
        salePrice: this.number(row.getCell(7).value),
        weight: this.number(row.getCell(8).value),
        weightUnit: this.text(row.getCell(9).value) || undefined,
        description: this.text(row.getCell(10).value) || undefined,
        note: this.text(row.getCell(11).value) || undefined,
      });
    });
    return rows;
  }

  private parseExtraUnits(
    sheet?: ExcelJS.Worksheet,
  ): Map<string, RawExtraUnitRow[]> {
    const result = new Map<string, RawExtraUnitRow[]>();
    if (!sheet) return result;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const productCode = this.text(row.getCell(1).value);
      if (!productCode) return;
      const value: RawExtraUnitRow = {
        productCode,
        unitName: this.text(row.getCell(2).value),
        conversionRate: this.number(row.getCell(3).value) ?? 0,
        salePrice: this.number(row.getCell(4).value) ?? 0,
        isPurchaseUnit: this.boolean(row.getCell(5).value),
      };
      const current = result.get(productCode) || [];
      current.push(value);
      result.set(productCode, current);
    });
    return result;
  }

  private parseBusinessStores(
    sheet?: ExcelJS.Worksheet,
  ): Map<string, RawBusinessStoreRow[]> {
    const result = new Map<string, RawBusinessStoreRow[]>();
    if (!sheet) return result;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const productCode = this.text(row.getCell(1).value);
      if (!productCode) return;
      const isSellingValue = this.text(row.getCell(5).value);
      const value: RawBusinessStoreRow = {
        productCode,
        storeCode: this.text(row.getCell(2).value),
        storeName: this.text(row.getCell(3).value) || undefined,
        costPrice: this.number(row.getCell(4).value),
        isSelling: isSellingValue ? this.boolean(isSellingValue) : true,
      };
      const current = result.get(productCode) || [];
      current.push(value);
      result.set(productCode, current);
    });
    return result;
  }

  private async findAttribute(
    name: string | undefined,
    type: AttributeType,
    req: RequestContext,
  ): Promise<string | null> {
    if (!name) return null;
    if (type === AttributeType.PRODUCT_GROUP) {
      return this.findProductGroupByPath(name, req);
    }
    return this.attributeRepository.findOrCreateAttribute({ name, type }, req);
  }

  private async findProductGroupByPath(
    groupPath: string,
    req: RequestContext,
  ): Promise<string | null> {
    const parts = groupPath
      .split(PRODUCT_GROUP_PATH_SEPARATOR)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return null;

    let parentId: string | null = null;
    for (const partName of parts) {
      parentId = await this.attributeRepository.findOrCreateAttribute(
        {
          name: partName,
          type: AttributeType.PRODUCT_GROUP,
          parentId,
        },
        req,
      );
    }
    return parentId;
  }

  private optionalNumber(
    value: number | undefined,
    label: string,
    rowNumber: number,
  ): number | null {
    if (value === undefined) return null;
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Dòng " + rowNumber + ": " + label + " phải là số không âm");
    }
    return value;
  }

  private parseWeightUnit(value: string | undefined, rowNumber: number): WeightUnit {
    if (!value) return WeightUnit.g;
    if (value === WeightUnit.g || value === WeightUnit.kg) {
      return value;
    }
    throw new Error("Dòng " + rowNumber + ": ĐVT trọng lượng chỉ nhận g hoặc kg");
  }

  private text(value: unknown): string {
    if (value && typeof value === "object" && "text" in value) {
      return String((value as any).text).trim();
    }
    return String(value ?? "").trim();
  }

  private number(value: unknown): number | undefined {
    if (value === null || value === undefined || value === "") return undefined;
    const number = typeof value === "number" ? value : Number(value);
    return number;
  }

  private boolean(value: unknown): boolean {
    const normalized = this.text(value).toLowerCase();
    return ["có", "co", "true", "1", "yes", "x"].includes(normalized);
  }

  private report(result: ImportResult, callback?: ImportProgressCallback): void {
    callback?.({
      totalRows: result.totalRows,
      processedRows:
        result.successRows + result.errorRows + result.skippedRows,
      successRows: result.successRows,
      errorRows: result.errorRows,
      skippedRows: result.skippedRows,
    });
  }
}
