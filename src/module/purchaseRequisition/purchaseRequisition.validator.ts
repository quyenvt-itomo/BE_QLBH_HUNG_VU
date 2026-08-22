import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  withSortOrder,
  BaseLineSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { ApproveStatus } from "@/shared/constants/enum";

export const PurchaseRequisitionLineSchema = BaseLineSchema.extend({
  productId: z.uuid({ message: "Vui lòng chọn hàng hóa" }),
  unitId: z.uuid({ message: "Vui lòng chọn đơn vị tính" }),
  quantity: z.number({ message: "Vui lòng nhập số lượng" }).min(0.01),
});

export const CreatePurchaseRequisitionSchema = BaseCreateSchema.extend({
  code: z.string().min(1),
  timeAt: DateTransform,
  departmentId: z.uuid().nullish(),
  requesterId: z.uuid().nullish(),
  orderId: z.uuid().nullish(),
  productionId: z.uuid().nullish(),
  lines: z
    .array(PurchaseRequisitionLineSchema)
    .min(1)
    .transform((items) => (items ? withSortOrder(items) : items)),
});

export const UpdatePurchaseRequisitionSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).optional(),
  timeAt: DateTransform.optional(),
  departmentId: z.uuid().nullish(),
  requesterId: z.uuid().nullish(),
  orderId: z.uuid().nullish(),
  productionId: z.uuid().nullish(),
  lines: z
    .array(PurchaseRequisitionLineSchema)
    .min(1)
    .transform((items) => (items ? withSortOrder(items) : items)),
});

export const PurchaseRequisitionQuerySchema = BaseQuerySchema.extend({
  approveStatus: z.enum(ApproveStatus).optional(),
  requesterId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  productionId: z.uuid().optional(),
});

export const PurchaseRequisitionParamsSchema = BaseParamsSchema;

export const RejectPurchaseRequisitionSchema = BaseParamsSchema.extend({
  rejectReason: z.string().min(1),
});

export type CreatePurchaseRequisitionDto = z.infer<
  typeof CreatePurchaseRequisitionSchema
>;
export type UpdatePurchaseRequisitionDto = z.infer<
  typeof UpdatePurchaseRequisitionSchema
>;
export type PurchaseRequisitionQueryDto = z.infer<
  typeof PurchaseRequisitionQuerySchema
>;
export type PurchaseRequisitionParamsDto = z.infer<
  typeof PurchaseRequisitionParamsSchema
>;
export type RejectPurchaseRequisitionDto = z.infer<
  typeof RejectPurchaseRequisitionSchema
>;
