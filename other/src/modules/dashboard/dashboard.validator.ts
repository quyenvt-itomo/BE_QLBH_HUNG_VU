import { DateTransform } from "@/shared/base/BaseValidator";
import { z } from "zod";

export const DashboardQuerySchema = z.object({
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
  storeId: z.uuid().optional(),
});

export const DashboardProductParamsSchema = z.object({
  id: z.uuid(),
});

export type DashboardQueryDto = z.infer<typeof DashboardQuerySchema>;
export type DashboardProductParamsDto = z.infer<
  typeof DashboardProductParamsSchema
>;
