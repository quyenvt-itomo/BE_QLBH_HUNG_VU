import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { AttributeTypeEnum } from "@/shared/constants/enum";
import * as z from "zod";

export const CreateAttributeSchema = BaseCreateSchema.extend({
  name: z.string(),
  type: z.enum(AttributeTypeEnum),
});

export const UpdateAttributeSchema = BaseUpdateSchema.extend({
  name: z.string().optional(),
});

export const AttributeQuerySchema = z.object({
  type: z.enum(AttributeTypeEnum),
});

export const AttributeParamsSchema = BaseParamsSchema;

export type CreateAttributeDto = z.infer<typeof CreateAttributeSchema>;
export type UpdateAttributeDto = z.infer<typeof UpdateAttributeSchema>;
export type AttributeQueryDto = z.infer<typeof AttributeQuerySchema>;
export type AttributeParamsDto = z.infer<typeof AttributeParamsSchema>;
