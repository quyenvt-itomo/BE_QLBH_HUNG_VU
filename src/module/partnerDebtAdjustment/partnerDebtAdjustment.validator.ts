import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { TransactionType } from "@/shared/constants/enum";
import { PartnerDebtSideEnum } from "@/database/models/PartnerDebtTransaction";

export const CreatePartnerDebtAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().min(1).max(25),
  occurredAt: DateTransform,
  side: z.enum(PartnerDebtSideEnum),
  partnerId: z.uuid(),
  // điều chỉnh theo từng hóa đơn (nếu có), ngược lại là điều chỉnh tổng
  invoiceId: z.uuid().nullish(),
  expectedAmount: z.number().min(0),
  countedAmount: z.number().min(0),
  deltaAmount: z.number(),
  type: z.enum(TransactionType),
  reason: z.string().nullish(),
  isInitial: z.boolean().optional().default(false),
});

export const UpdatePartnerDebtAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).max(25).optional(),
  occurredAt: DateTransform.optional(),
  side: z.enum(PartnerDebtSideEnum).optional(),
  partnerId: z.uuid().optional(),
  invoiceId: z.uuid().nullish(),
  expectedAmount: z.number().min(0).optional(),
  countedAmount: z.number().min(0).optional(),
  deltaAmount: z.number().optional(),
  type: z.enum(TransactionType).optional(),
  reason: z.string().nullish(),
  isInitial: z.boolean().optional(),
});

export const PartnerDebtAdjustmentQuerySchema = BaseQuerySchema.extend({
  partnerId: z.uuid().optional(),
  side: z.enum(PartnerDebtSideEnum).optional(),
  type: z.enum(TransactionType).optional(),
  isInitial: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

export const PartnerDebtAdjustmentParamsSchema = BaseParamsSchema;

export type CreatePartnerDebtAdjustmentDto = z.infer<
  typeof CreatePartnerDebtAdjustmentSchema
>;
export type UpdatePartnerDebtAdjustmentDto = z.infer<
  typeof UpdatePartnerDebtAdjustmentSchema
>;
export type PartnerDebtAdjustmentQueryDto = z.infer<
  typeof PartnerDebtAdjustmentQuerySchema
>;
export type PartnerDebtAdjustmentParamsDto = z.infer<
  typeof PartnerDebtAdjustmentParamsSchema
>;
