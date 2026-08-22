import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ImportOptions, ImportResult } from "../excel.types";
import {
  PRODUCT_SHEET_NAMES,
  productTypeMap,
  RawProductRow,
  RawExtraUnitRow,
} from "./product.excel.types";
import { PRODUCT_TYPES } from "../../product/product.types";
import { ProductService } from "../../product/product.service";
import { ATTRIBUTE_TYPES } from "../../attribute/attribute.types";
import { AttributeService } from "../../attribute/attribute.service";
import { BadRequestError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import { Product, ProductType } from "@/database/models/company/Product";
import { AttributeType } from "@/database/models/Attribute";
import { DeepPartial } from "typeorm";
import { ProductExtraUnit } from "@/database/models/company/ProductExtraUnit";
import logger from "@/shared/utils/logger";
import { withTransaction } from "@/shared/base/TransactionManager";

@injectable()
export class ProductExcelProcessor {
  constructor(
    @inject(PRODUCT_TYPES.ProductService)
    private productService: ProductService,
    @inject(ATTRIBUTE_TYPES.AttributeService)
    private attributeService: AttributeService,
  ) {}

  async processImport(
    req: RequestContext,
    workbook: ExcelJS.Workbook,
    options: ImportOptions,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      skippedRows: 0,
      errors: [],
      data: [],
    };
    try {
      const sheet = workbook.getWorksheet(PRODUCT_SHEET_NAMES.MAIN);
      if (!sheet)
        throw new BadRequestError(
          `Không tìm thấy sheet '${PRODUCT_SHEET_NAMES.MAIN}'`,
        );
      const rows = this.parseSheet(sheet);
      result.totalRows = rows.length;
      if (!rows.length) return result;

      // Parse extra units sheet
      const euSheet = workbook.getWorksheet(PRODUCT_SHEET_NAMES.EXTRA_UNITS);
      const extraUnitsMap = euSheet
        ? this.parseExtraUnits(euSheet)
        : new Map<string, RawExtraUnitRow[]>();

      const reverseTypeMap: Record<string, ProductType> = {};
      for (const [k, v] of Object.entries(productTypeMap))
        reverseTypeMap[v] = k as ProductType;

      const companyId = req.companyContext?.companyId;
      if (!companyId) throw new BadRequestError("Thiếu thông tin công ty");

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        try {
          if (!row.code || !row.name || !row.type)
            throw new Error("Thiếu mã, tên hoặc loại");
          const type = reverseTypeMap[row.type] || (row.type as ProductType);

          // Resolve baseUnitName → baseUnitId
          let baseUnitId: string | null = null;
          if (row.baseUnitName) {
            baseUnitId = (
              await this.attributeService.findOrCreate(
                row.baseUnitName,
                AttributeType.UNIT,
                req,
              )
            ).id;
          }

          // Resolve groupName → groupId
          let groupId: string | null = null;
          if (row.groupName) {
            groupId = (
              await this.attributeService.findOrCreate(
                row.groupName,
                this.getGroupType(type),
                req,
              )
            ).id;
          }

          const data: DeepPartial<Product> = {
            code: row.code,
            name: row.name,
            type,
            groupId,
            baseUnitId,
            price: row.price ?? 0,
            taxRate: row.taxRate ?? 0,
            isPublic: row.isPublic === "Có",
            note: row.note || null,
          };

          let saved: Product | null = null;
          await withTransaction(async (manager) => {
            const existing = await this.productService.findOne({
              where: { code: row.code, companyId },
            });
            if (existing && options.duplicateHandling === "update") {
              saved = await this.productService.update(
                existing.id,
                data,
                manager,
                req,
              );
            } else if (existing && options.duplicateHandling === "skip") {
              result.skippedRows++;
              return;
            } else if (existing && options.duplicateHandling === "stop") {
              throw new Error(`Mã ${row.code} đã tồn tại`);
            } else {
              (data as DeepPartial<Product>).companyId = companyId;
              saved = await this.productService.create(data, manager, req);
            }

            // Process extra units
            const productExtraUnits = extraUnitsMap.get(row.code);
            if (productExtraUnits && productExtraUnits.length > 0 && saved) {
              const extraUnitRepo = manager.getRepository(ProductExtraUnit);

              // Xoá extra units cũ nếu update
              if (existing && options.duplicateHandling === "update") {
                await extraUnitRepo.delete({ productId: saved.id });
              }

              for (const eu of productExtraUnits) {
                const unitId = (
                  await this.attributeService.findOrCreate(
                    eu.unitName,
                    AttributeType.UNIT,
                    req,
                  )
                ).id;
                await extraUnitRepo.save(
                  extraUnitRepo.create({
                    productId: saved.id,
                    unitId,
                    conversionRate: eu.conversionRate,
                    pricePerUnit: eu.pricePerUnit ?? 0,
                  }),
                );
              }
            }
          });
          result.successRows++;
        } catch (err: unknown) {
          result.errorRows++;
          const message = err instanceof Error ? err.message : String(err);
          result.errors.push({
            row: rowNum,
            message,
            data: row,
          });
          if (options.errorHandling === "stop_on_error") break;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("[Product Import] Failed:", err);
      result.errors.push({ row: 0, message });
      result.errorRows = result.totalRows;
    }
    return result;
  }

  private parseSheet(sheet: ExcelJS.Worksheet): RawProductRow[] {
    const rows: RawProductRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const code = String(row.getCell(1).value || "").trim();
      if (!code) return;
      rows.push({
        code,
        name: String(row.getCell(2).value || "").trim(),
        type: String(row.getCell(3).value || "").trim(),
        groupName: String(row.getCell(4).value || "").trim(),
        baseUnitName: String(row.getCell(5).value || "").trim(),
        price: Number(row.getCell(6).value) || 0,
        taxRate: Number(row.getCell(7).value) || 0,
        isPublic: String(row.getCell(8).value || "").trim(),
        note: String(row.getCell(9).value || "").trim(),
      });
    });
    return rows;
  }

  private parseExtraUnits(
    sheet: ExcelJS.Worksheet,
  ): Map<string, RawExtraUnitRow[]> {
    const map = new Map<string, RawExtraUnitRow[]>();
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const productCode = String(row.getCell(1).value || "").trim();
      if (!productCode) return;
      const eu: RawExtraUnitRow = {
        productCode,
        unitName: String(row.getCell(2).value || "").trim(),
        conversionRate: Number(row.getCell(3).value) || 1,
        pricePerUnit: Number(row.getCell(4).value) || undefined,
      };
      if (!map.has(productCode)) map.set(productCode, []);
      map.get(productCode)!.push(eu);
    });
    return map;
  }

  /** Map ProductType → AttributeType cho nhóm hàng hóa */
  private getGroupType(productType: ProductType): AttributeType {
    switch (productType) {
      case ProductType.FINISHED:
        return AttributeType.FINISHED_GROUP;
      case ProductType.MAIN_MATERIAL:
        return AttributeType.MAIN_MATERIAL_GROUP;
      case ProductType.SUB_MATERIAL:
        return AttributeType.SUB_MATERIAL_GROUP;
      default:
        return AttributeType.FINISHED_GROUP;
    }
  }
}
