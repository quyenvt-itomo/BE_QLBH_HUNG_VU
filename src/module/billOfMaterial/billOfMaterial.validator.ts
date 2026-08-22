import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateBillOfMaterialSchema = BaseCreateSchema.extend({
  productId: z.uuid(),
  unitId: z.uuid(),
});

export const UpdateBillOfMaterialSchema = BaseUpdateSchema.extend({
  productId: z.uuid().optional(),
  unitId: z.uuid().optional(),
});

export const BillOfMaterialQuerySchema = BaseQuerySchema.extend({
  productId: z.uuid().optional(),
  unitId: z.uuid().optional(),
});

export const BillOfMaterialParamsSchema = BaseParamsSchema;

export type CreateBillOfMaterialDto = z.infer<
  typeof CreateBillOfMaterialSchema
>;
export type UpdateBillOfMaterialDto = z.infer<
  typeof UpdateBillOfMaterialSchema
>;
export type BillOfMaterialQueryDto = z.infer<typeof BillOfMaterialQuerySchema>;
export type BillOfMaterialParamsDto = z.infer<
  typeof BillOfMaterialParamsSchema
>;
