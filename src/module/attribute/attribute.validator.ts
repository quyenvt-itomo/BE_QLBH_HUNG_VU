import { z } from "zod";
import {
  BaseQuerySchema,
  BaseParamsSchema,
  BaseCreateSchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { AttributeType } from "@/database/models";

export const CreateAttributeSchema = BaseCreateSchema.extend({
  name: z.string().trim().max(255),
  type: z.enum(AttributeType),
  parentId: z.uuid().nullish(),
});

export const UpdateAttributeSchema = BaseUpdateSchema.extend({
  name: z.string().trim().max(255).optional(),
  type: z.enum(AttributeType).optional(),
  parentId: z.uuid().nullish(),
});

export const AttributeQuerySchema = BaseQuerySchema;

export const AttributeParamsSchema = BaseParamsSchema;

export type CreateAttributeDto = z.infer<typeof CreateAttributeSchema>;
export type UpdateAttributeDto = z.infer<typeof UpdateAttributeSchema>;
export type AttributeQueryDto = z.infer<typeof AttributeQuerySchema>;
export type AttributeParamsDto = z.infer<typeof AttributeParamsSchema>;
