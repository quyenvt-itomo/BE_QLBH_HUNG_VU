import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import {
  GateLogTypeEnum,
  GateLogStatusEnum,
} from "@/database/models/company/GateLog";

export const CreateGateLogSchema = BaseCreateSchema.extend({
  timeAt: DateTransform.optional(),
  type: z.enum(GateLogTypeEnum),
  stockDocumentId: z.uuid().nullish(),
  partnerId: z.uuid().nullish(),
  warehouseId: z.uuid().nullish(),
  shippingPlanId: z.uuid().nullish(),
  vehicleType: z.string().max(255).nullish(),
  vehiclePlate: z.string().max(255).nullish(),
});

export const UpdateGateLogSchema = BaseUpdateSchema.extend({
  timeAt: DateTransform.optional(),
  stockDocumentId: z.uuid().nullish(),
  partnerId: z.uuid().nullish(),
  warehouseId: z.uuid().nullish(),
  shippingPlanId: z.uuid().nullish(),
  vehicleType: z.string().max(255).nullish(),
  vehiclePlate: z.string().max(255).nullish(),
});

export const GateEntrySchema = z.object({
  entryTime: DateTransform.optional(),
  entryNote: z.string().nullish(),
  entryPlateImages: z.array(z.string()).optional().default([]),
  entryCargoImages: z.array(z.string()).optional().default([]),
});

export const GateExitSchema = z.object({
  exitTime: DateTransform.optional(),
  exitNote: z.string().nullish(),
  exitPlateImages: z.array(z.string()).optional().default([]),
  exitCargoImages: z.array(z.string()).optional().default([]),
});

export const LinkGateLogSchema = z.object({
  linkedGateLogId: z.uuid(),
});

export const GateLogQuerySchema = BaseQuerySchema.extend({
  type: z.enum(GateLogTypeEnum).optional(),
  status: z.enum(GateLogStatusEnum).optional(),
  stockDocumentId: z.uuid().optional(),
  partnerId: z.uuid().optional(),
  warehouseId: z.uuid().optional(),
});

export const GateLogParamsSchema = BaseParamsSchema;

export type CreateGateLogDto = z.infer<typeof CreateGateLogSchema>;
export type UpdateGateLogDto = z.infer<typeof UpdateGateLogSchema>;
export type GateEntryDto = z.infer<typeof GateEntrySchema>;
export type GateExitDto = z.infer<typeof GateExitSchema>;
export type LinkGateLogDto = z.infer<typeof LinkGateLogSchema>;
export type GateLogQueryDto = z.infer<typeof GateLogQuerySchema>;
export type GateLogParamsDto = z.infer<typeof GateLogParamsSchema>;
