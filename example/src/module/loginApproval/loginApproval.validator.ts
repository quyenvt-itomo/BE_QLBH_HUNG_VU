import { z } from "zod";
import { BaseQuerySchema, BaseParamsSchema } from "@/shared/base/BaseValidator";
import { LoginApprovalStatusEnum } from "@/database/models/LoginApproval";

export const LoginApprovalQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid().optional(),
  userId: z.uuid().optional(),
  status: z.enum(LoginApprovalStatusEnum).optional(),
});

export const LoginApprovalParamsSchema = BaseParamsSchema;

export const RejectLoginApprovalSchema = z.object({
  rejectReason: z.string().max(500).optional(),
});

export type LoginApprovalQueryDto = z.infer<typeof LoginApprovalQuerySchema>;
export type RejectLoginApprovalDto = z.infer<typeof RejectLoginApprovalSchema>;
