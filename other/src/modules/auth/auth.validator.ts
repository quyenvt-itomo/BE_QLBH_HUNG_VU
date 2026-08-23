import { AddressSchema, DateTransform } from "@/shared/base/BaseValidator";
import { Gender } from "@/shared/constants/enum";
import { email, z } from "zod";

export const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const SeenNotificationSchema = z.object({
  ids: z.array(z.number().min(1, "notificationIds.min")),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});
export const UpdateInfoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.email().nullish(),
  phone: z.string().min(10).max(15).nullish(),
  gender: z.enum(Gender).nullish(),
  dob: DateTransform.nullish(),
  address: AddressSchema.nullish(),
});

export const PayloadWithEmailSchema = z.object({
  email: z
    .string({
      message: "email.required",
    })
    .email("email.invalid"),
});

export const PayloadWithPasswordSchema = z.object({
  password: z.string().min(6, "password.min").max(128, "password.max"),
  isLogout: z.boolean().optional(),
});
export const VerifyOtpSchema = z.object({
  otp: z.string().min(1, "otp.required").length(6, "otp.length"),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type SeenNotificationDto = z.infer<typeof SeenNotificationSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type UpdateInfoDto = z.infer<typeof UpdateInfoSchema>;
export type PayloadWithEmailDto = z.infer<typeof PayloadWithEmailSchema>;
export type PayloadWithPasswordDto = z.infer<typeof PayloadWithPasswordSchema>;
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
