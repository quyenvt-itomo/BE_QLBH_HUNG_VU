import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";

export const CreatePartnerContactSchema = BaseCreateSchema.extend({
  partnerId: z.string().uuid(),
  name: z.string().min(1).max(255),
  phone: z.string().max(50).nullish(),
  email: z.string().email().max(255).nullish(),
  banks: z.array(z.any()).optional().default([]),
});

export const UpdatePartnerContactSchema = BaseUpdateSchema.extend({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).nullish(),
  email: z.string().email().max(255).nullish(),
  banks: z.array(z.any()).optional(),
});

export const PartnerContactQuerySchema = BaseQuerySchema.extend({
  partnerId: z.string().uuid().optional(),
});

export const PartnerContactParamsSchema = BaseParamsSchema;

export type CreatePartnerContactDto = z.infer<
  typeof CreatePartnerContactSchema
>;
export type UpdatePartnerContactDto = z.infer<
  typeof UpdatePartnerContactSchema
>;
export type PartnerContactQueryDto = z.infer<typeof PartnerContactQuerySchema>;
