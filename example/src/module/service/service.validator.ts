import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  BaseCodeSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { ServiceTypeEnum } from "@/database/models/company/Service";

export const ServiceUnitSchema = z.object({
  id: z.uuid().optional(),
  unitId: z.uuid(),
  costPrice: z.number().min(0),
  unitPrice: z.number().min(0),
});

export const CreateServiceSchema = BaseCreateSchema.extend({
  type: z.enum(ServiceTypeEnum),
  code: BaseCodeSchema.optional(),
  name: z.string().trim().nonempty(),
  taxRate: z.number().min(0).max(100).default(0),
  units: z.array(ServiceUnitSchema).optional().default([]),
});

export const UpdateServiceSchema = BaseUpdateSchema.extend({
  type: z.enum(ServiceTypeEnum).optional(),
  code: BaseCodeSchema.optional(),
  name: z.string().trim().nonempty().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  units: z.array(ServiceUnitSchema).optional(),
});

export const ServiceQuerySchema = BaseQuerySchema.extend({
  type: z.enum(ServiceTypeEnum).optional(),
});

export const ServiceParamsSchema = BaseParamsSchema;

export type CreateServiceDto = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>;
export type ServiceQueryDto = z.infer<typeof ServiceQuerySchema>;
export type ServiceParamsDto = z.infer<typeof ServiceParamsSchema>;
