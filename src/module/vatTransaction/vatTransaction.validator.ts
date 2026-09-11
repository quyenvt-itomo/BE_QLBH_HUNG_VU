import { z } from "zod";
import {
  BaseCreateSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";

export const VatBalanceQuerySchema = BaseQuerySchema.extend({
  occurredAt: DateTransform,
  excludeId: z.uuid().optional(),
});

export type VatBalanceQueryDto = z.infer<typeof VatBalanceQuerySchema>;

export {
  BaseCreateSchema as CreateVatTransactionSchema,
  BaseUpdateSchema as UpdateVatTransactionSchema,
  BaseQuerySchema as VatTransactionQuerySchema,
} from "@/shared/base/BaseValidator";
