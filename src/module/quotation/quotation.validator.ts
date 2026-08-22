import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  BaseLineSchema,
  AdditionalInfoSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import {
  ApproveStatus,
  CommissionMode,
  SaleLineTypeEnum,
} from "@/shared/constants/enum";

export const QuotationLineSchema = BaseLineSchema.extend({
  type: z
    .enum([SaleLineTypeEnum.PRODUCT, SaleLineTypeEnum.SERVICE])
    .default(SaleLineTypeEnum.PRODUCT),
  productId: z.uuid().nullish(),
  serviceId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  materialId: z.uuid().nullish(),
  rawQuantity: z.number().positive(),
  rawUnitPrice: z.number().min(0),
  rawSubTotal: z.number().min(0),
  rawMaterialQuantity: z.number().min(0).default(0),
  rawMaterialUnitPrice: z.number().min(0).default(0),
  rawAdditionalCost: z.number().min(0).default(0),
  rawMaterialTotalCost: z.number().min(0).default(0),
  rawProfit: z.number().default(0),
});

export const QuotationCommissionSchema = z.object({
  id: z.uuid().optional(),
  partnerContactId: z.uuid(),
  totalAmount: z.number().min(0),
});

export const CreateQuotationSchema = BaseCreateSchema.extend({
  timeAt: DateTransform.optional(),
  validUntil: DateTransform.nullish(),
  quotationRequestId: z.uuid().nullish(),
  customerId: z.uuid().nullish(),
  customerSnapshot: z.record(z.string(), z.unknown()).nullish(),
  commissionMode: z.enum(CommissionMode).nullish(),
  staffId: z.uuid().nullish(),
  meshSpecId: z.uuid().nullish(),
  additionalInfo: z.array(AdditionalInfoSchema).optional().default([]),
  lines: z.array(QuotationLineSchema).default([]),
  commissions: z.array(QuotationCommissionSchema).optional().default([]),
});

export const UpdateQuotationSchema = BaseUpdateSchema.extend({
  timeAt: DateTransform.optional(),
  validUntil: DateTransform.nullish(),
  customerId: z.uuid().nullish(),
  customerSnapshot: z.record(z.string(), z.unknown()).nullish(),
  staffId: z.uuid().nullish(),
  meshSpecId: z.uuid().nullish(),
  additionalInfo: z.array(AdditionalInfoSchema).optional(),
  lines: z.array(QuotationLineSchema).optional(),
  commissions: z.array(QuotationCommissionSchema).optional(),
});

export const QuotationQuerySchema = BaseQuerySchema.extend({
  approveStatus: z
    .enum([
      ApproveStatus.PENDING,
      ApproveStatus.APPROVED,
      ApproveStatus.REJECTED,
      ApproveStatus.CUSTOMER_APPROVED,
      ApproveStatus.CUSTOMER_REJECTED,
    ])
    .optional(),
  customerId: z.uuid().optional(),
  staffId: z.uuid().optional(),
  quotationRequestId: z.uuid().optional(),
});

export const QuotationParamsSchema = BaseParamsSchema;

export const StaffApproveSchema = z.object({
  rejectReason: z.string().trim().optional(),
});

export type CreateQuotationDto = z.infer<typeof CreateQuotationSchema>;
export type UpdateQuotationDto = z.infer<typeof UpdateQuotationSchema>;
export type QuotationQueryDto = z.infer<typeof QuotationQuerySchema>;
export type QuotationParamsDto = z.infer<typeof QuotationParamsSchema>;
export type StaffApproveDto = z.infer<typeof StaffApproveSchema>;
