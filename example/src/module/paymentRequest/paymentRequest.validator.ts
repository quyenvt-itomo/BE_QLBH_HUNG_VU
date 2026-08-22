import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  BaseLineSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { PaymentRequestTypeEnum } from "@/database/models/company/PaymentRequest";
import { ApproveStatus } from "@/shared/constants/enum";
import { FundTypeEnum } from "@/database/models/company/Fund";

export const PaymentRequestLineSchema = BaseLineSchema.extend({
  invoiceId: z.uuid().nullish(),
  amount: z.number().min(0),
});

export const CreatePaymentRequestSchema = BaseCreateSchema.extend({
  timeAt: DateTransform.optional(),
  type: z.enum(PaymentRequestTypeEnum),
  staffId: z.uuid().nullish(),
  partnerId: z.uuid().nullish(),
  partnerContactId: z.uuid().nullish(),
  paymentMethod: z.enum(FundTypeEnum).nullish(),
  totalAmount: z.number().min(0),
  lines: z.array(PaymentRequestLineSchema).default([]),
});

export const UpdatePaymentRequestSchema = BaseUpdateSchema.extend({
  staffId: z.uuid().nullish(),
  partnerId: z.uuid().nullish(),
  partnerContactId: z.uuid().nullish(),
  paymentMethod: z.enum(FundTypeEnum).nullish(),
  totalAmount: z.number().min(0).optional(),
  lines: z.array(PaymentRequestLineSchema).optional(),
});

export const RejectPaymentRequestSchema = z.object({
  rejectReason: z.string().min(1),
});

export const PaymentRequestQuerySchema = BaseQuerySchema.extend({
  type: z.enum(PaymentRequestTypeEnum).optional(),
  approveStatus: z.enum(ApproveStatus).optional(),
  partnerId: z.uuid().optional(),
  staffId: z.uuid().optional(),
});

export const PaymentRequestParamsSchema = BaseParamsSchema;

export type CreatePaymentRequestDto = z.infer<
  typeof CreatePaymentRequestSchema
>;
export type UpdatePaymentRequestDto = z.infer<
  typeof UpdatePaymentRequestSchema
>;
export type RejectPaymentRequestDto = z.infer<
  typeof RejectPaymentRequestSchema
>;
export type PaymentRequestQueryDto = z.infer<typeof PaymentRequestQuerySchema>;
export type PaymentRequestParamsDto = z.infer<
  typeof PaymentRequestParamsSchema
>;
