import {
  AddressSchema,
  BankAccountSchema,
  BaseCodeSchema,
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  RepresentativeSchema,
  zBooleanLike,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { PartnerType } from "@/database/models/company/Partner";

export const PartnerContactSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().nonempty(),
  phone: z.string().trim().nullish(),
  email: z.email().nullish(),
  banks: z.array(BankAccountSchema).optional().default([]),
});

export const CreatePartnerSchema = BaseCreateSchema.extend({
  storeId: z.uuid(),
  types: z.array(z.enum(PartnerType)).min(1),
  groupId: z.uuid().nullish(),
  staffId: z.uuid().nullish(),
  paymentTermId: z.uuid().nullish(),

  name: z.string().trim().nonempty(),
  code: BaseCodeSchema.optional(),
  email: z.email().nullish(),
  phone: z.string().trim().nullish(),
  zaloLink: z.string().trim().nullish(),
  taxCode: z.string().trim().nullish(),
  address: AddressSchema.nullish(),
  representative: RepresentativeSchema.nullish(),
  banks: z.array(BankAccountSchema).optional().default([]),
  contacts: z.array(PartnerContactSchema).optional().default([]),
});

export const UpdatePartnerSchema = BaseUpdateSchema.extend({
  types: z.array(z.enum(PartnerType)).min(1).optional(),
  groupId: z.uuid().nullish(),
  staffId: z.uuid().nullish(),
  paymentTermId: z.uuid().nullish(),

  name: z.string().trim().nonempty().optional(),
  code: BaseCodeSchema.optional(),
  email: z.email().nullish(),
  phone: z.string().trim().nullish(),
  zaloLink: z.string().trim().nullish(),
  taxCode: z.string().trim().nullish(),
  address: AddressSchema.nullish(),
  representative: RepresentativeSchema.nullish(),
  banks: z.array(BankAccountSchema).optional(),
  contacts: z.array(PartnerContactSchema).optional(),
});

export const PartnerQuerySchema = BaseQuerySchema.extend({
  type: z.enum(PartnerType).optional(),
  groupId: z.uuid().optional(),
});

export const PartnerParamsSchema = BaseParamsSchema;
export const PartnerPublicParamsSchema = z.object({
  taxCode: z.string().trim().min(1),
});

export type CreatePartnerDto = z.infer<typeof CreatePartnerSchema>;
export type UpdatePartnerDto = z.infer<typeof UpdatePartnerSchema>;
export type PartnerQueryDto = z.infer<typeof PartnerQuerySchema>;
export type PartnerParamsDto = z.infer<typeof PartnerParamsSchema>;
export type PartnerPublicParamsDto = z.infer<typeof PartnerPublicParamsSchema>;
