import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";

export const CreateServiceUnitSchema = BaseCreateSchema.extend({
  serviceId: z.string().uuid(),
  unitId: z.string().uuid(),
  costPrice: z.number().min(0),
  unitPrice: z.number().min(0),
});

export const UpdateServiceUnitSchema = BaseUpdateSchema.extend({
  unitId: z.string().uuid().optional(),
  costPrice: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
});

export const ServiceUnitQuerySchema = BaseQuerySchema.extend({
  serviceId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
});

export const ServiceUnitParamsSchema = BaseParamsSchema;

export type CreateServiceUnitDto = z.infer<typeof CreateServiceUnitSchema>;
export type UpdateServiceUnitDto = z.infer<typeof UpdateServiceUnitSchema>;
export type ServiceUnitQueryDto = z.infer<typeof ServiceUnitQuerySchema>;
