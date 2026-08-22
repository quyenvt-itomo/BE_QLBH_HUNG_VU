import { z } from "zod";
import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
  zEnumFromTsEnum,
} from "@/shared/base/BaseValidator";
import {
  ShiftStatusEnum,
  CHECKLIST_KEY,
  ChecklistKey,
} from "@/shared/constants/enum";

const CashSnapshotSchema = z.object({
  "500000": z.number().int().min(0).default(0),
  "200000": z.number().int().min(0).default(0),
  "100000": z.number().int().min(0).default(0),
  "50000": z.number().int().min(0).default(0),
  "20000": z.number().int().min(0).default(0),
  "10000": z.number().int().min(0).default(0),
  "5000": z.number().int().min(0).default(0),
  "2000": z.number().int().min(0).default(0),
  "1000": z.number().int().min(0).default(0),
});

const ShiftChecklistSchema: z.ZodType<Record<ChecklistKey, boolean>> = z.object(
  Object.fromEntries(
    Object.values(CHECKLIST_KEY).map((key) => [
      key,
      z.boolean().default(false),
    ]),
  ) as Record<ChecklistKey, z.ZodDefault<z.ZodBoolean>>,
);

export const CreateShiftSchema = BaseCreateSchema.extend({
  storeId: z.uuid(),
  userId: z.uuid().optional(), // có thể không truyền, backend sẽ lấy từ token
  startAt: DateTransform.optional(),
  openingCash: z.number().nonnegative(),
  openingCashSnapshot: CashSnapshotSchema.nullish(),
  openingChecklist: ShiftChecklistSchema.nullish(),
});

export const UpdateShiftSchema = BaseUpdateSchema.extend({
  openingCash: z.number().nonnegative().optional(),
  openingCashSnapshot: CashSnapshotSchema.nullish(),
  openingChecklist: ShiftChecklistSchema.nullish(),
  storeId: z.uuid().optional(),
});

export const OpenShiftSchema = z.object({
  openingCash: z.number().nonnegative(),
  openingCashSnapshot: CashSnapshotSchema.nullish(),
  openingChecklist: ShiftChecklistSchema.nullish(),
  note: z.string().nullish(),
});

export const CloseShiftSchema = z.object({
  closingCash: z.number().nonnegative(),
  closingCashSnapshot: CashSnapshotSchema.nullish(),
  closingChecklist: ShiftChecklistSchema.nullish(),
  note: z.string().nullish(),
});

export const ShiftQuerySchema = BaseQuerySchema.extend({
  status: zEnumFromTsEnum(ShiftStatusEnum).optional(),
  storeId: z.uuid().optional(),
});

export const ShiftParamsSchema = BaseParamsSchema;

export type CreateShiftDto = z.infer<typeof CreateShiftSchema>;
export type UpdateShiftDto = z.infer<typeof UpdateShiftSchema>;
export type OpenShiftDto = z.infer<typeof OpenShiftSchema>;
export type CloseShiftDto = z.infer<typeof CloseShiftSchema>;
export type ShiftQueryDto = z.infer<typeof ShiftQuerySchema>;
export type ShiftParamsDto = z.infer<typeof ShiftParamsSchema>;
