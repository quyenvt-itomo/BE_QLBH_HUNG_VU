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
} from "@/shared/base/BaseValidator";
import { CreatePartnerContactSchema } from "../partnerContact/partnerContact.validator";

export const CreatePartnerSchema = BaseCreateSchema.extend({
  type: z.enum(PartnerType),
  groupId: z.uuid(),

  isOrganization: z.boolean().default(true),

  name: z.string().nonempty(),
  code: z.string().optional(),
  email: z.email().nullish(),
  phone: z.string().nullish(),
  taxCode: z.string().nullish(),
  addresses: z.array(AddressSchema).optional(),
  representative: RepresentativeSchema.nullish(),
  banks: z.array(BankAccountSchema).optional(),

  contacts: z.array(CreatePartnerContactSchema).optional().default([]),
});

export const UpdatePartnerSchema = BaseUpdateSchema.extend({
  groupId: z.uuid().optional(),

  isOrganization: z.boolean().optional(),

  name: z.string().nonempty().optional(),
  code: z.string().optional(),
  email: z.email().nullish(),
  phone: z.string().nullish(),
  taxCode: z.string().nullish(),
  addresses: z.array(AddressSchema).optional(),
  representative: RepresentativeSchema.nullish(),
  banks: z.array(BankAccountSchema).optional(),
});

// Extend BaseQuerySchema with Partner-specific filters
export const PartnerQuerySchema = BaseQuerySchema.extend({
  type: z.enum(PartnerType),
  offsetAt: DateTransform.optional(),
});

export const PartnerParamsSchema = BaseParamsSchema;

export type CreatePartnerDto = z.infer<typeof CreatePartnerSchema>;
export type UpdatePartnerDto = z.infer<typeof UpdatePartnerSchema>;
export type PartnerQueryDto = z.infer<typeof PartnerQuerySchema>;
export type PartnerParamsDto = z.infer<typeof PartnerParamsSchema>;
