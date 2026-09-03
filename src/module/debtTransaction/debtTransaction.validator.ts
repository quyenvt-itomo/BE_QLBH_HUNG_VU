import { z } from "zod";
import { DebtRefType } from "@/database/models/DebtTransaction";
import { BaseQuerySchema } from "@/shared/base/BaseValidator";
import { DebtSide } from "@/shared/constants/enum";

export const DebtTransactionQuerySchema = BaseQuerySchema.extend({
  partnerId: z.uuid().optional(),
  side: z.enum(DebtSide).optional(),
  refType: z.enum(DebtRefType).optional(),
});

export type DebtTransactionQueryDto = z.infer<typeof DebtTransactionQuerySchema>;
