import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  zBooleanLike,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreatePaymentRequestLineSchema = BaseCreateSchema.extend({
  paymentRequestId: z.uuid(),
  code: z.string().min(1).max(50),
  invoiceId: z.uuid().nullish(),
  orderId: z.uuid().nullish(),
  amount: z.number().positive(),
  isPaid: z.boolean().default(false),
});

export const UpdatePaymentRequestLineSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).max(50).optional(),
  invoiceId: z.uuid().nullish(),
  orderId: z.uuid().nullish(),
  amount: z.number().positive().optional(),
  isPaid: z.boolean().optional(),
});

export const PaymentRequestLineQuerySchema = BaseQuerySchema.extend({
  paymentRequestId: z.uuid().optional(),
  invoiceId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  isPaid: zBooleanLike(),
});

export const PaymentRequestLineParamsSchema = BaseParamsSchema;

export type CreatePaymentRequestLineDto = z.infer<
  typeof CreatePaymentRequestLineSchema
>;
export type UpdatePaymentRequestLineDto = z.infer<
  typeof UpdatePaymentRequestLineSchema
>;
export type PaymentRequestLineQueryDto = z.infer<
  typeof PaymentRequestLineQuerySchema
>;
export type PaymentRequestLineParamsDto = z.infer<
  typeof PaymentRequestLineParamsSchema
>;
