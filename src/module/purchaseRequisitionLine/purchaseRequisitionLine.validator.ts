import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreatePurchaseRequisitionLineSchema = BaseCreateSchema.extend({
  purchaseRequisitionId: z.uuid(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive(),
});

export const UpdatePurchaseRequisitionLineSchema = BaseUpdateSchema.extend({
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive().optional(),
});

export const PurchaseRequisitionLineQuerySchema = BaseQuerySchema.extend({
  purchaseRequisitionId: z.uuid().optional(),
  productId: z.uuid().optional(),
});

export const PurchaseRequisitionLineParamsSchema = BaseParamsSchema;

export type CreatePurchaseRequisitionLineDto = z.infer<
  typeof CreatePurchaseRequisitionLineSchema
>;
export type UpdatePurchaseRequisitionLineDto = z.infer<
  typeof UpdatePurchaseRequisitionLineSchema
>;
export type PurchaseRequisitionLineQueryDto = z.infer<
  typeof PurchaseRequisitionLineQuerySchema
>;
export type PurchaseRequisitionLineParamsDto = z.infer<
  typeof PurchaseRequisitionLineParamsSchema
>;
