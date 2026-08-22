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
import * as z from "zod";
import { CreatePartnerContactSchema } from "./partnerContact/partnerContact.validator";
import { CreatePartnerSubTypeSchema } from "./partnerSubType";
import { PartnerTypeEnum } from "@/shared/constants/enum";
import dayjs from "dayjs";

export const CreatePartnerSchema = BaseCreateSchema.extend({
  type: z.enum(PartnerTypeEnum),
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
  subTypes: z.array(CreatePartnerSubTypeSchema).optional().default([]),
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
  type: z.enum(PartnerTypeEnum),
  offsetAt: DateTransform.optional(),
});

export const PartnerQueryByRoleSchema = z.object({
  page: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  keyword: z.string().optional(),
  role: z.enum(PartnerTypeEnum).optional(),
  offsetAt: DateTransform.optional(),
  storeId: z.uuid().optional(),
});

export const PartnerParamsSchema = BaseParamsSchema;

export type CreatePartnerDto = z.infer<typeof CreatePartnerSchema>;
export type UpdatePartnerDto = z.infer<typeof UpdatePartnerSchema>;
export type PartnerQueryDto = z.infer<typeof PartnerQuerySchema>;
export type PartnerParamsDto = z.infer<typeof PartnerParamsSchema>;
export type PartnerQueryByRoleDto = z.infer<typeof PartnerQueryByRoleSchema>;
