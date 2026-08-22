import { z } from "zod";
import {
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  AddressSchema,
  BaseCreateSchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { GenderEnum } from "@/shared/constants/enum";

export const CreateUserSchema = BaseCreateSchema.extend({
  code: z.string().optional(),
  name: z.string().nonempty().max(255),
  username: z.string().max(100),
  password: z.string().max(255),
  email: z.email().max(255).optional(),
  phone: z.string().max(255).optional(),
  gender: z.enum(GenderEnum).optional(),
  dob: DateTransform.optional(),
  address: AddressSchema.optional(),
  systemRoleId: z.uuid().optional(),
  employeeId: z.uuid().nullish(),

  storeUsers: z
    .array(
      z.object({
        roleId: z.uuid(),
      }),
    )
    .optional(),
}).refine(
  (data) => {
    const usernameRegex = /^\S+$/;
    return (
      usernameRegex.test(data.username) &&
      !data.username.toLowerCase().includes("admin")
    );
  },
  {
    path: ["username"],
    message: "invalid username",
  },
);

export const UpdateUserSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  name: z.string().max(255).optional(),
  email: z.email().max(255).nullish(),
  phone: z.string().max(255).nullish(),
  gender: z.enum(GenderEnum).nullish(),
  dob: DateTransform.nullish(),
  address: AddressSchema.nullish(),
  systemRoleId: z.uuid().nullish(),
  employeeId: z.uuid().nullish(),
  isActive: z.boolean().optional(),
  storeUsers: z
    .array(
      z.object({
        id: z.string().optional(),
        roleId: z.uuid(),
      }),
    )
    .optional(),
});

export const UserQuerySchema = BaseQuerySchema;

export const UserParamsSchema = BaseParamsSchema;

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UserQueryDto = z.infer<typeof UserQuerySchema>;
export type UserParamsDto = z.infer<typeof UserParamsSchema>;
