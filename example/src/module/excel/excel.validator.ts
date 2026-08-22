import * as z from "zod";
import {
  ExcelEntityType,
  ImportErrorHandling,
  ImportDuplicateHandling,
} from "./excel.types";

export const ExportOptionsSchema = z.object({
  entityType: z.enum(ExcelEntityType),
  branchId: z.uuid().optional(),
  columns: z
    .array(
      z.object({
        field: z.string().trim(),
        header: z.string().trim().optional(),
        width: z.number().optional(),
      }),
    )
    .optional(),
  filters: z.record(z.string().trim(), z.any()).optional(),
  filename: z.string().trim().optional(),
});

export const ImportOptionsSchema = z.object({
  entityType: z.enum(ExcelEntityType),
  fileId: z.string().trim().min(1, "Vui lòng chọn file để import"),
  branchId: z.uuid().optional(),
  errorHandling: z.enum(ImportErrorHandling),
  duplicateHandling: z.enum(ImportDuplicateHandling),
  uniqueFields: z.array(z.string().trim()).optional(),
});

export const GetTemplateParamsSchema = z.object({
  entityType: z.enum(ExcelEntityType),
});

export const GetTemplateQuerySchema = z.object({
  branchId: z.uuid().optional(),
});

export type ExportOptionsDto = z.infer<typeof ExportOptionsSchema>;
export type ImportOptionsDto = z.infer<typeof ImportOptionsSchema>;
