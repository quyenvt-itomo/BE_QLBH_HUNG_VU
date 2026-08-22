import { z } from "zod";
import {
  AddressSchema,
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseCodeSchema,
  zEnumFromTsEnum,
  zBooleanLike,
} from "@/shared/base/BaseValidator";
import { OrganizationTypeEnum } from "@/database/models/Organization";

export const CreateOrganizationSchema = BaseCreateSchema.extend({
  parentId: z.uuid().nullish(),
  name: z.string().trim().trim().max(255),
  code: BaseCodeSchema,
  type: zEnumFromTsEnum(OrganizationTypeEnum),
  phone: z.string().trim().trim().max(20).nullish(),
  email: z.email().nullish(),
  taxCode: z.string().trim().trim().max(255).nullish(),
  address: AddressSchema.nullish(),
  managerId: z.uuid().nullish(),
  industry: z.string().trim().trim().max(255).nullish(),
  responsibility: z.string().trim().trim().max(255).nullish(),
  establishment: z.string().trim().trim().max(255).nullish(),
  operations: z
    .array(
      z.object({
        id: z.uuid().optional(),
        operationId: z.uuid(),
      }),
    )
    .optional(),
});

export const UpdateOrganizationSchema = BaseUpdateSchema.extend({
  parentId: z.uuid().nullish(),
  name: z.string().trim().trim().max(255).optional(),
  code: BaseCodeSchema.optional(),
  type: zEnumFromTsEnum(OrganizationTypeEnum).optional(),
  phone: z.string().trim().trim().nullish(),
  email: z.email().nullish(),
  taxCode: z.string().trim().trim().max(255).nullish(),
  address: AddressSchema.nullish(),
  managerId: z.uuid().nullish(),
  industry: z.string().trim().trim().max(255).nullish(),
  responsibility: z.string().trim().trim().max(255).nullish(),
  establishment: z.string().trim().trim().max(255).nullish(),
  operations: z
    .array(
      z.object({
        id: z.uuid().optional(),
        operationId: z.uuid(),
      }),
    )
    .optional(),
});

export const UpdateSortOrderSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.uuid(),
        sortOrder: z.number(),
      }),
    )
    .min(1),
});

export const OrganizationQuerySchema = BaseQuerySchema.extend({
  parentId: z.uuid().optional(),
  managerId: z.uuid().optional(),
  type: zEnumFromTsEnum(OrganizationTypeEnum).optional(),
  types: z.array(zEnumFromTsEnum(OrganizationTypeEnum)).optional(),
  getAll: zBooleanLike(),
});
export const OrganizationParamsSchema = BaseParamsSchema;
export const OrganizationPublicParamsSchema = z.object({
  code: BaseCodeSchema,
});

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;
export type OrganizationQueryDto = z.infer<typeof OrganizationQuerySchema>;
export type OrganizationParamsDto = z.infer<typeof OrganizationParamsSchema>;
export type OrganizationPublicParamsDto = z.infer<
  typeof OrganizationPublicParamsSchema
>;
export type UpdateSortOrderDto = z.infer<typeof UpdateSortOrderSchema>;
