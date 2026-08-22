import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreatePurchaseLineSchema = BaseCreateSchema.extend({
  purchaseId: z.uuid(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).default(0),
  commissionRate: z.number().min(0).default(0),
});

export const UpdatePurchaseLineSchema = BaseUpdateSchema.extend({
  purchaseId: z.uuid().optional(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  commissionRate: z.number().min(0).optional(),
});

export const PurchaseLineQuerySchema = BaseQuerySchema.extend({
  purchaseId: z.uuid().optional(),
  productId: z.uuid().optional(),
});

export const PurchaseLineParamsSchema = BaseParamsSchema;

export type CreatePurchaseLineDto = z.infer<typeof CreatePurchaseLineSchema>;
export type UpdatePurchaseLineDto = z.infer<typeof UpdatePurchaseLineSchema>;
export type PurchaseLineQueryDto = z.infer<typeof PurchaseLineQuerySchema>;
export type PurchaseLineParamsDto = z.infer<typeof PurchaseLineParamsSchema>;
