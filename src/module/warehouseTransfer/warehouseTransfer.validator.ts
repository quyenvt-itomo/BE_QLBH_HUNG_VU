import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  BaseLineSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const TransferLineSchema = BaseLineSchema.extend({
  productId: z.uuid(),
  unitId: z.uuid(),
  conversionRateAtTime: z.number().positive().default(1),
  requestQuantity: z.number().positive(),
  actualQuantity: z.number().min(0).default(0),
  receivedQuantity: z.number().min(0).default(0),
});

export const CreateWarehouseTransferSchema = BaseCreateSchema.extend({
  timeAt: DateTransform.optional(),
  fromWarehouseId: z.uuid().nullish(),
  fromWarehouseSnapshot: z.record(z.string(), z.unknown()).nullish(),
  toWarehouseId: z.uuid().nullish(),
  toWarehouseSnapshot: z.record(z.string(), z.unknown()).nullish(),
  reason: z.string().nullish(),
  lines: z.array(TransferLineSchema).default([]),
});

export const UpdateWarehouseTransferSchema = BaseUpdateSchema.extend({
  timeAt: DateTransform.optional(),
  fromWarehouseId: z.uuid().nullish(),
  toWarehouseId: z.uuid().nullish(),
  reason: z.string().nullish(),
  lines: z.array(TransferLineSchema).optional(),
});

export const ConfirmTransferSchema = z.object({
  lines: z.array(
    z.object({
      id: z.uuid(),
      quantity: z.number().min(0),
    }),
  ),
  confirmedAt: DateTransform.nullish(),
});

export const WarehouseTransferQuerySchema = BaseQuerySchema.extend({
  fromWarehouseId: z.uuid().optional(),
  toWarehouseId: z.uuid().optional(),
});

export const WarehouseTransferParamsSchema = BaseParamsSchema;

export type CreateWarehouseTransferDto = z.infer<
  typeof CreateWarehouseTransferSchema
>;
export type UpdateWarehouseTransferDto = z.infer<
  typeof UpdateWarehouseTransferSchema
>;
export type ConfirmTransferDto = z.infer<typeof ConfirmTransferSchema>;
export type WarehouseTransferQueryDto = z.infer<
  typeof WarehouseTransferQuerySchema
>;
export type WarehouseTransferParamsDto = z.infer<
  typeof WarehouseTransferParamsSchema
>;
