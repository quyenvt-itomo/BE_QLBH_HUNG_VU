import * as z from "zod";
import { PartnerType } from "@/database/models";
import {
  AddressSchema,
  BankAccountSchema,
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
  RepresentativeSchema,
  zArrayable,
  zBooleanLike,
} from "@/shared/base/BaseValidator";
import { CreatePartnerContactSchema } from "../partnerContact/partnerContact.validator";
import { Gender } from "@/shared/constants/enum";
import {
  PARTNER_FIELD_LIMITS,
  partnerMaxLengthMessage,
} from "./partner.constants";

export const PartnerNameSchema = z
  .string()
  .trim()
  .min(1, "Tên không được để trống")
  .max(PARTNER_FIELD_LIMITS.name, partnerMaxLengthMessage("name"));

export const PartnerCodeSchema = z
  .string()
  .trim()
  .max(PARTNER_FIELD_LIMITS.code, partnerMaxLengthMessage("code"));

export const PartnerEmailSchema = z
  .email("Email không hợp lệ")
  .trim()
  .max(PARTNER_FIELD_LIMITS.email, partnerMaxLengthMessage("email"));

export const PartnerPhoneSchema = z
  .string()
  .trim()
  .max(PARTNER_FIELD_LIMITS.phone, partnerMaxLengthMessage("phone"));

export const PartnerTaxCodeSchema = z
  .string()
  .trim()
  .max(PARTNER_FIELD_LIMITS.taxCode, partnerMaxLengthMessage("taxCode"));

export const PartnerIdentityCodeSchema = z
  .string()
  .trim()
  .max(
    PARTNER_FIELD_LIMITS.identityCode,
    partnerMaxLengthMessage("identityCode"),
  );

export const PartnerImportRowSchema = z.object({
  name: PartnerNameSchema,
  code: PartnerCodeSchema.optional(),
  email: PartnerEmailSchema.nullish(),
  phone: PartnerPhoneSchema.nullish(),
  taxCode: PartnerTaxCodeSchema.nullish(),
  identityCode: PartnerIdentityCodeSchema.nullish(),
  groupName: z
    .string()
    .trim()
    .max(PARTNER_FIELD_LIMITS.groupName, partnerMaxLengthMessage("groupName"))
    .nullish(),
  representativeName: z
    .string()
    .trim()
    .max(
      PARTNER_FIELD_LIMITS.representativeName,
      partnerMaxLengthMessage("representativeName"),
    )
    .nullish(),
  representativePhone: z
    .string()
    .trim()
    .max(
      PARTNER_FIELD_LIMITS.representativePhone,
      partnerMaxLengthMessage("representativePhone"),
    )
    .nullish(),
  representativeEmail: z
    .string()
    .trim()
    .max(
      PARTNER_FIELD_LIMITS.representativeEmail,
      partnerMaxLengthMessage("representativeEmail"),
    )
    .nullish(),
  representativeIdentityCode: z
    .string()
    .trim()
    .max(
      PARTNER_FIELD_LIMITS.representativeIdentityCode,
      partnerMaxLengthMessage("representativeIdentityCode"),
    )
    .nullish(),
});

export const CreatePartnerSchema = BaseCreateSchema.extend({
  type: z.enum(PartnerType),
  groupId: z.uuid().nullish(),

  isOrganization: z.boolean().default(true),

  name: PartnerNameSchema,
  code: PartnerCodeSchema.optional(),
  email: PartnerEmailSchema.nullish(),
  phone: PartnerPhoneSchema.nullish(),
  taxCode: PartnerTaxCodeSchema.nullish(),
  identityCode: PartnerIdentityCodeSchema.nullish(),
  gender: z.enum(Gender).nullish(),
  dob: DateTransform.nullish(),
  maxDebtAmount: z.number().nonnegative().nullish(),
  address: AddressSchema.nullish(),
  representative: RepresentativeSchema.nullish(),
  banks: z.array(BankAccountSchema).optional(),

  contacts: z.array(CreatePartnerContactSchema).optional().default([]),
});

export const UpdatePartnerSchema = BaseUpdateSchema.extend({
  groupId: z.uuid().nullish(),

  isOrganization: z.boolean().optional(),

  name: PartnerNameSchema.optional(),
  code: PartnerCodeSchema.optional(),
  email: PartnerEmailSchema.nullish(),
  phone: PartnerPhoneSchema.nullish(),
  taxCode: PartnerTaxCodeSchema.nullish(),
  identityCode: PartnerIdentityCodeSchema.nullish(),
  gender: z.enum(Gender).nullish(),
  dob: DateTransform.nullish(),
  maxDebtAmount: z.number().nonnegative().nullish(),
  address: AddressSchema.nullish(),
  representative: RepresentativeSchema.nullish(),
  banks: z.array(BankAccountSchema).optional(),
});

// Extend BaseQuerySchema with Partner-specific filters
export const PartnerQuerySchema = BaseQuerySchema.extend({
  type: z.enum(PartnerType),
  isOrganization: zBooleanLike(),
  gender: zArrayable(z.enum(Gender)),
  states: zArrayable(z.string().trim().min(1)),
  wards: zArrayable(z.string().trim().min(1)),
  offsetAt: DateTransform.optional(),
  supplierGroupId: z.uuid().optional(),
  customerGroupId: z.uuid().optional(),
  shipperGroupId: z.uuid().optional(),
});

export const PartnerParamsSchema = BaseParamsSchema;

export type CreatePartnerDto = z.infer<typeof CreatePartnerSchema>;
export type UpdatePartnerDto = z.infer<typeof UpdatePartnerSchema>;
export type PartnerQueryDto = z.infer<typeof PartnerQuerySchema>;
export type PartnerParamsDto = z.infer<typeof PartnerParamsSchema>;
