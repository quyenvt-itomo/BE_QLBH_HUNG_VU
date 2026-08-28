import { z } from "zod";
import {
  ExcelEntityType,
  ImportDuplicateHandling,
  ImportErrorHandling,
} from "./excel.types";

const ColumnSchema = z.object({
  field: z.string().min(1),
  header: z.string().min(1),
  width: z.number().optional(),
  required: z.boolean().optional(),
  type: z.enum(["string", "number", "boolean", "date"]).optional(),
  options: z.array(z.string()).optional(),
  numberFormat: z.string().optional(),
  sheet: z.string().min(1).optional(),
});

export const ExportOptionsSchema = z.object({
  entityType: z.enum(ExcelEntityType),
  columns: z.array(ColumnSchema).optional().default([]),
  extraUnitColumns: z.array(ColumnSchema).optional().default([]),
  businessStoreColumns: z.array(ColumnSchema).optional().default([]),
  sheetColumns: z.record(z.string(), z.array(ColumnSchema)).optional().default({}),
  filters: z.record(z.string(), z.unknown()).optional().default({}),
  filename: z.string().trim().max(150).optional(),
});

export const ImportOptionsSchema = z.object({
  entityType: z.enum(ExcelEntityType),
  fileId: z.uuid(),
  errorHandling: z.enum(ImportErrorHandling),
  duplicateHandling: z.enum(ImportDuplicateHandling),
  uniqueFields: z.array(z.string()).optional(),
});

export const GetTemplateParamsSchema = z.object({
  entityType: z.enum(ExcelEntityType),
});

export const GetTemplateQuerySchema = z.object({});
