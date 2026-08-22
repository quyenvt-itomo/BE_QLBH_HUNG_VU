import { z } from "zod";
import {
  BaseCodeSchema,
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";

export const CreateJobPositionSchema = BaseCreateSchema.extend({
  companyId: z.uuid(),
  code: BaseCodeSchema.optional(),
  name: z.string().trim().trim().max(255),
  level: z.string().trim().trim().max(255).nullish(),
  jobTitleId: z.uuid().nullish(),
});

export const UpdateJobPositionSchema = BaseUpdateSchema.extend({
  code: BaseCodeSchema.optional(),
  name: z.string().trim().trim().max(255).optional(),
  level: z.string().trim().trim().max(255).nullish(),
  jobTitleId: z.uuid().nullish(),
});

export const JobPositionQuerySchema = BaseQuerySchema.extend({
  companyId: z.uuid().optional(),
  jobTitleId: z.uuid().optional(),
});

export const JobPositionParamsSchema = BaseParamsSchema;

export type CreateJobPositionDto = z.infer<typeof CreateJobPositionSchema>;
export type UpdateJobPositionDto = z.infer<typeof UpdateJobPositionSchema>;
export type JobPositionQueryDto = z.infer<typeof JobPositionQuerySchema>;
export type JobPositionParamsDto = z.infer<typeof JobPositionParamsSchema>;
