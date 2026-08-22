import { AddressSchema, BaseUpdateSchema } from "@/shared/base/BaseValidator";
import { z } from "zod";

export const LoginSchema = z.object({
  username: z
    .string("Tên đăng nhập không hợp lệ")
    .nonempty("Tên đăng nhập không được để trống"),
  password: z
    .string("Mật khẩu không hợp lệ")
    .nonempty("Mật khẩu không được để trống"),
  deviceId: z.string().max(255).optional(),
  deviceInfo: z.record(z.string(), z.unknown()).optional(),
});

export const SeenNotificationSchema = z.object({
  ids: z.array(z.number().min(1, "Vui lòng cung cấp ít nhất một thông báo")),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().trim().optional(),
});

export const PayloadWithEmailSchema = z.object({
  email: z.email("Email không hợp lệ"),
});
export const PayloadWithPasswordSchema = z.object({
  password: z
    .string()
    .min(6, "Mật khẩu cần tối thiểu 6 ký tự")
    .max(128, "Mật khẩu không được vượt quá 128 ký tự"),
  isLogout: z.boolean().optional(),
});

export const VerifyOtpSchema = z.object({
  otp: z.string().trim().length(6, "Độ dài mã OTP không hợp lệ"),
});

export const UpdateAuthSchema = BaseUpdateSchema.extend({
  name: z.string().trim().max(255).optional(),
  email: z.email().optional(),
  phone: z.string().trim().optional(),
  gender: z.boolean().optional(),
  address: z.array(AddressSchema).optional(),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type SeenNotificationDto = z.infer<typeof SeenNotificationSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type PayloadWithEmailDto = z.infer<typeof PayloadWithEmailSchema>;
export type PayloadWithPasswordDto = z.infer<typeof PayloadWithPasswordSchema>;
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
