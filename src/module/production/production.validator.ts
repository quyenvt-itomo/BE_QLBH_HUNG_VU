import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import {
  ProductionTypeEnum,
  ProductionStatusEnum,
} from "@/database/models/Production";

export const CreateProductionSchema = BaseCreateSchema.extend({
  type: z
    .enum([
      ProductionTypeEnum.MESH,
      ProductionTypeEnum.STEEL_DRAWING,
      ProductionTypeEnum.NORMAL,
    ])
    .default(ProductionTypeEnum.NORMAL),
  timeAt: DateTransform.optional(),
  name: z.string().max(255).optional(),
  sequenceNumber: z.number().int().positive().default(1),
  orderId: z.uuid().nullish(),
  orderSnapshot: z.record(z.string(), z.unknown()).nullish(),
  meshSpecId: z.uuid().nullish(),
  meshSpecSnapshot: z.record(z.string(), z.unknown()).nullish(),
  staffId: z.uuid().nullish(),
  staffSnapshot: z.record(z.string(), z.unknown()).nullish(),
  factoryId: z.uuid().nullish(),
  factorySnapshot: z.record(z.string(), z.unknown()).nullish(),
  areaColumn: z.string().max(255).nullish(),
  quantityUnitId: z.uuid().nullish(),
});

export const UpdateProductionSchema = BaseUpdateSchema.extend({
  type: z
    .enum([
      ProductionTypeEnum.MESH,
      ProductionTypeEnum.STEEL_DRAWING,
      ProductionTypeEnum.NORMAL,
    ])
    .optional(),
  timeAt: DateTransform.optional(),
  name: z.string().max(255).optional(),
  orderId: z.uuid().nullish(),
  meshSpecId: z.uuid().nullish(),
  staffId: z.uuid().nullish(),
  factoryId: z.uuid().nullish(),
  areaColumn: z.string().max(255).nullish(),
  quantityUnitId: z.uuid().nullish(),
});

export const ProductionQuerySchema = BaseQuerySchema.extend({
  type: z
    .enum([
      ProductionTypeEnum.MESH,
      ProductionTypeEnum.STEEL_DRAWING,
      ProductionTypeEnum.NORMAL,
    ])
    .optional(),
  status: z
    .enum([
      ProductionStatusEnum.PLANNING,
      ProductionStatusEnum.IN_PROGRESS,
      ProductionStatusEnum.COMPLETED,
      ProductionStatusEnum.CANCELLED,
    ])
    .optional(),
  orderId: z.uuid().optional(),
  staffId: z.uuid().optional(),
  factoryId: z.uuid().optional(),
});

export const ProductionParamsSchema = BaseParamsSchema;

export type CreateProductionDto = z.infer<typeof CreateProductionSchema>;
export type UpdateProductionDto = z.infer<typeof UpdateProductionSchema>;
export type ProductionQueryDto = z.infer<typeof ProductionQuerySchema>;
export type ProductionParamsDto = z.infer<typeof ProductionParamsSchema>;
