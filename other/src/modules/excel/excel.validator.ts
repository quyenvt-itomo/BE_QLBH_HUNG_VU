import { z } from "zod";
import {
  ExcelEntityType,
  ImportErrorHandling,
  ImportDuplicateHandling,
} from "./excel.types";

// Export validation
export const ExportColumnConfigSchema = z.object({
  field: z.string(),
  header: z.string(),
  width: z.number().optional(),
  format: z.string().optional(),
  required: z.boolean().optional(),
});

export const ExportOptionsSchema = z.object({
  storeId: z.string().optional(),
  entityType: z.enum(ExcelEntityType),
  columns: z.array(ExportColumnConfigSchema).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  filename: z.string().optional(),
  includeStock: z.boolean().optional().default(false),
});

export type ExportOptionsDto = z.infer<typeof ExportOptionsSchema>;

// Import validation
export const ImportOptionsSchema = z.object({
  entityType: z.enum(ExcelEntityType),
  fileId: z.uuid(),
  errorHandling: z.enum(ImportErrorHandling),
  duplicateHandling: z.enum(ImportDuplicateHandling),
  uniqueFields: z.array(z.string()).optional(),
  storeId: z.uuid().optional(),
});

export type ImportOptionsDto = z.infer<typeof ImportOptionsSchema>;

// Get template validation
// Get template validation với query params cho template động
export const GetTemplateParamsSchema = z.object({
  entityType: z.enum(ExcelEntityType),
});

export const GetTemplateQuerySchema = z.object({
  storeId: z.uuid().optional(),
  filters: z.string().optional(), // JSON string của filters
});

export type GetTemplateParamsDto = z.infer<typeof GetTemplateParamsSchema>;
export type GetTemplateQueryDto = z.infer<typeof GetTemplateQuerySchema>;
