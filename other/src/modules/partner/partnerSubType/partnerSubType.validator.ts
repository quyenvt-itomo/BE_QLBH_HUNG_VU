import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { PartnerTypeEnum } from "@/shared/constants/enum";
import * as z from "zod";

export const CreatePartnerSubTypeSchema = BaseCreateSchema.extend({
  type: z.enum(PartnerTypeEnum),
  groupId: z.uuid(),
});

export const UpdatePartnerSubTypeSchema = BaseUpdateSchema.extend({
  groupId: z.uuid().optional(),
});

// Extend BaseQuerySchema with PartnerSubType-specific filters
export const PartnerSubTypeQuerySchema = BaseQuerySchema;

export const PartnerSubTypeCreateParamsSchema = z.object({
  partnerId: z.uuid(),
});
export const PartnerSubTypeParamsSchema = BaseParamsSchema.extend({
  partnerId: z.uuid(),
});

export type CreatePartnerSubTypeDto = z.infer<
  typeof CreatePartnerSubTypeSchema
>;
export type UpdatePartnerSubTypeDto = z.infer<
  typeof UpdatePartnerSubTypeSchema
>;
export type PartnerSubTypeQueryDto = z.infer<typeof PartnerSubTypeQuerySchema>;
export type PartnerSubTypeParamsDto = z.infer<
  typeof PartnerSubTypeParamsSchema
>;
export type PartnerSubTypeCreateParamsDto = z.infer<
  typeof PartnerSubTypeCreateParamsSchema
>;
