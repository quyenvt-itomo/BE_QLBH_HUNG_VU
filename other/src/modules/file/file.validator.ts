import { EntityTypeEnum, FileCategoryEnum } from "@/shared/constants/enum";
import * as z from "zod";

/**
 * UUID params validator
 */
export const FileParamsSchema = z.object({
  id: z.uuid(),
});

export const UploadSchema = z.object({
  entityId: z.uuid().optional(),
  entityType: z.enum(EntityTypeEnum),
  category: z.enum(FileCategoryEnum),
  isActive: z
    .preprocess((val) => {
      if (typeof val === "string") return val === "true";
      return val;
    }, z.boolean())
    .optional()
    .default(false),
  isPublic: z
    .preprocess((val) => {
      if (typeof val === "string") return val === "true";
      return val;
    }, z.boolean())
    .optional()
    .default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Export type
export type FileParamsDto = z.infer<typeof FileParamsSchema>;
export type UploadDto = z.infer<typeof UploadSchema>;
