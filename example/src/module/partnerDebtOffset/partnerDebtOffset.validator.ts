import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";

const OffsetLineSchema = z.object({
  invoiceId: z.uuid(),
  amount: z.number().positive(),
});
export type OffsetLineDto = z.infer<typeof OffsetLineSchema>;

export const CreatePartnerDebtOffsetSchema = BaseCreateSchema.extend({
  code: z.string().min(1).max(25),
  occurredAt: DateTransform,
  partnerId: z.uuid(),
  // 2 danh sách hóa đơn đầu vào / đầu ra kèm giá trị giảm trừ cho từng hóa đơn.
  // Tổng giá trị giảm trừ 2 bên phải bằng nhau (= offsetAmount).
  payableLines: z.array(OffsetLineSchema).default([]),
  receivableLines: z.array(OffsetLineSchema).default([]),
  reason: z.string().nullish(),
});

export const UpdatePartnerDebtOffsetSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).max(25).optional(),
  occurredAt: DateTransform.optional(),
  partnerId: z.uuid().optional(),
  payableLines: z.array(OffsetLineSchema).optional(),
  receivableLines: z.array(OffsetLineSchema).optional(),
  reason: z.string().nullish(),
});

export const PartnerDebtOffsetQuerySchema = BaseQuerySchema.extend({
  partnerId: z.uuid().optional(),
});

export const PartnerDebtOffsetParamsSchema = BaseParamsSchema;

export type CreatePartnerDebtOffsetDto = z.infer<
  typeof CreatePartnerDebtOffsetSchema
>;
export type UpdatePartnerDebtOffsetDto = z.infer<
  typeof UpdatePartnerDebtOffsetSchema
>;
export type PartnerDebtOffsetQueryDto = z.infer<
  typeof PartnerDebtOffsetQuerySchema
>;
export type PartnerDebtOffsetParamsDto = z.infer<
  typeof PartnerDebtOffsetParamsSchema
>;
