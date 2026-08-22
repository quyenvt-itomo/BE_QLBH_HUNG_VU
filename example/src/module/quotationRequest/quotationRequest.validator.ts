import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  BaseLineSchema,
  BasePublicParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { ApproveStatus } from "@/shared/constants/enum";

export const QuotationRequestLineSchema = BaseLineSchema.extend({
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive(),
});

export const CreateQuotationRequestSchema = BaseCreateSchema.extend({
  timeAt: DateTransform.optional(),
  staffId: z.uuid().nullish(),
  customerId: z.uuid().nullish(),
  customerSnapshot: z.record(z.string(), z.unknown()).nullish(),
  requesterId: z.uuid().nullish(),
  requesterSnapshot: z.record(z.string(), z.unknown()).nullish(),
  lines: z.array(QuotationRequestLineSchema).default([]),
});

export const UpdateQuotationRequestSchema = BaseUpdateSchema.extend({
  timeAt: DateTransform.optional(),
  staffId: z.uuid().nullish(),
  customerId: z.uuid().nullish(),
  customerSnapshot: z.record(z.string(), z.unknown()).nullish(),
  requesterId: z.uuid().nullish(),
  requesterSnapshot: z.record(z.string(), z.unknown()).nullish(),
  lines: z.array(QuotationRequestLineSchema).optional(),
});

export const QuotationRequestQuerySchema = BaseQuerySchema.extend({
  approveStatus: z
    .enum([
      ApproveStatus.PENDING,
      ApproveStatus.APPROVED,
      ApproveStatus.REJECTED,
    ])
    .optional(),
  customerId: z.uuid().optional(),
  staffId: z.uuid().optional(),
});

export const QuotationRequestParamsSchema = BaseParamsSchema;
export const QuotationRequestPublicParamsSchema = BasePublicParamsSchema;

export const ApproveRejectSchema = z.object({
  rejectReason: z.string().trim().optional(),
  createPartner: z.boolean().default(false),
});

export type CreateQuotationRequestDto = z.infer<
  typeof CreateQuotationRequestSchema
>;
export type UpdateQuotationRequestDto = z.infer<
  typeof UpdateQuotationRequestSchema
>;
export type QuotationRequestQueryDto = z.infer<
  typeof QuotationRequestQuerySchema
>;
export type QuotationRequestParamsDto = z.infer<
  typeof QuotationRequestParamsSchema
>;
export type ApproveRejectDto = z.infer<typeof ApproveRejectSchema>;
export type QuotationRequestPublicParamsDto = z.infer<
  typeof QuotationRequestPublicParamsSchema
>;
