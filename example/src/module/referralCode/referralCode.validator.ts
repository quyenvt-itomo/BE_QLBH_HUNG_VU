import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";

export const CreateReferralCodeSchema = z.object({
  purchaseRequisitionId: z.uuid(),
  partnerId: z.uuid().nullish(),
  expiresAt: DateTransform.nullish(),
  linesSnapshot: z
    .array(
      z.object({
        productId: z.uuid(),
        productCode: z.string(),
        productName: z.string(),
        unitId: z.uuid().nullish(),
        unitName: z.string().nullish(),
        quantity: z.number().min(0),
      }),
    )
    .optional(),
});

export const ReferralCodeQuerySchema = BaseQuerySchema.extend({
  purchaseRequisitionId: z.uuid().optional(),
});

export const ReferralCodePublicParamsSchema = z.object({
  code: z.string().min(1),
});

export type CreateReferralCodeDto = z.infer<typeof CreateReferralCodeSchema>;
export type ReferralCodeQueryDto = z.infer<typeof ReferralCodeQuerySchema>;
