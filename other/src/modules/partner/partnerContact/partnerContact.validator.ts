import {
  BankAccountSchema,
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreatePartnerContactSchema = BaseCreateSchema.extend({
  name: z.string().nonempty(),
  email: z.email().nullish(),
  phone: z.string().nullish(),
  banks: z.array(BankAccountSchema).optional(),
});

export const UpdatePartnerContactSchema = BaseUpdateSchema.extend({
  name: z.string().nonempty().optional(),
  email: z.email().nullish(),
  phone: z.string().nullish(),
  banks: z.array(BankAccountSchema).optional(),
});

// Extend BaseQuerySchema with PartnerContact-specific filters
export const PartnerContactQuerySchema = BaseQuerySchema;

export const PartnerContactCreateParamsSchema = z.object({
  partnerId: z.uuid(),
});

export const PartnerContactParamsSchema = BaseParamsSchema.extend({
  partnerId: z.uuid(),
});

export type CreatePartnerContactDto = z.infer<
  typeof CreatePartnerContactSchema
>;
export type UpdatePartnerContactDto = z.infer<
  typeof UpdatePartnerContactSchema
>;
export type PartnerContactQueryDto = z.infer<typeof PartnerContactQuerySchema>;
export type PartnerContactParamsDto = z.infer<
  typeof PartnerContactParamsSchema
>;
export type PartnerContactCreateParamsDto = z.infer<
  typeof PartnerContactCreateParamsSchema
>;
