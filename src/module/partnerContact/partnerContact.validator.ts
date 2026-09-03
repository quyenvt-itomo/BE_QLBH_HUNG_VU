import {
  BankAccountSchema,
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import {
  PARTNER_FIELD_LIMITS,
  partnerMaxLengthMessage,
} from "../partner/partner.constants";

export const PartnerContactNameSchema = z
  .string()
  .trim()
  .min(1, "Tên người liên hệ không được để trống")
  .max(
    PARTNER_FIELD_LIMITS.contactName,
    partnerMaxLengthMessage("contactName"),
  );

export const PartnerContactEmailSchema = z
  .string()
  .trim()
  .max(
    PARTNER_FIELD_LIMITS.contactEmail,
    partnerMaxLengthMessage("contactEmail"),
  )
  .email("Email người liên hệ không hợp lệ");

export const PartnerContactPhoneSchema = z
  .string()
  .trim()
  .max(
    PARTNER_FIELD_LIMITS.contactPhone,
    partnerMaxLengthMessage("contactPhone"),
  );

export const PartnerContactIdentityCodeSchema = z
  .string()
  .trim()
  .max(
    PARTNER_FIELD_LIMITS.identityCode,
    partnerMaxLengthMessage("identityCode"),
  );

export const PartnerContactImportRowSchema = z.object({
  partnerCode: z
    .string()
    .trim()
    .min(1, "Mã đối tác không được để trống")
    .max(PARTNER_FIELD_LIMITS.code, partnerMaxLengthMessage("code")),
  name: PartnerContactNameSchema,
  email: PartnerContactEmailSchema.nullish(),
  phone: PartnerContactPhoneSchema.nullish(),
  identityCode: PartnerContactIdentityCodeSchema.nullish(),
});

export const CreatePartnerContactSchema = BaseCreateSchema.extend({
  name: PartnerContactNameSchema,
  email: PartnerContactEmailSchema.nullish(),
  phone: PartnerContactPhoneSchema.nullish(),
  identityCode: PartnerContactIdentityCodeSchema.nullish(),
  banks: z.array(BankAccountSchema).optional(),
});

export const UpdatePartnerContactSchema = BaseUpdateSchema.extend({
  name: PartnerContactNameSchema.optional(),
  email: PartnerContactEmailSchema.nullish(),
  phone: PartnerContactPhoneSchema.nullish(),
  identityCode: PartnerContactIdentityCodeSchema.nullish(),
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
