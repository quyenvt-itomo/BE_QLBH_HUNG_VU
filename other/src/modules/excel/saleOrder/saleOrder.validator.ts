import { z } from "zod";
import { DateTransform } from "@/shared/base/BaseValidator";
import { DiscountTypeEnum } from "@/shared/constants/enum";
import { OrderKey, OrderLineKey } from "./saleOrder.types";

/**
 * Validator cho OrderLine từ Excel
 * Mềm hơn validator của UI - sử dụng nhiều default
 */
export const SaleOrderLineRowSchema = z.object({
  [OrderLineKey.PRODUCT_VARIANT_CODE]: z
    .string()
    .trim()
    .min(1, "Mã sản phẩm không được để trống"),
  [OrderLineKey.PRODUCT_VARIANT_NAME]: z
    .string()
    .trim()
    .nullish()
    .default(null),
  [OrderLineKey.SPECIFICATION]: z.string().trim().nullish().default(null),
  [OrderLineKey.UNIT_PRICE]: z.number().min(0, "Đơn giá phải >= 0"),
  [OrderLineKey.QUANTITY]: z.number().min(0.001, "Số lượng phải > 0"),

  // Line discount
  [OrderLineKey.LINE_DISCOUNT_TYPE]: z
    .string()
    .trim()
    .nullish()
    .transform((val) => {
      if (!val) return DiscountTypeEnum.AMOUNT;
      const lower = val.toLowerCase();
      if (
        lower === "percent" ||
        lower === "%" ||
        lower === "phần trăm" ||
        lower === "phan tram"
      ) {
        return DiscountTypeEnum.PERCENT;
      }
      return DiscountTypeEnum.AMOUNT; // "số tiền", "amount", etc.
    })
    .default(DiscountTypeEnum.AMOUNT),
  [OrderLineKey.LINE_DISCOUNT_VALUE]: z.number().min(0).nullish().default(null),

  // Tax
  [OrderLineKey.TAX_RATE]: z.number().min(0).max(100).nullish().default(null),
});

/**
 * Validator cho Order từ Excel
 * Mềm hơn validator của UI - sử dụng nhiều default
 */
export const SaleOrderRowSchema = z.object({
  _rowNumber: z.number(),

  // Order fields
  [OrderKey.CODE]: z.string().trim().min(1, "Mã đơn hàng không được để trống"),
  [OrderKey.PARTNER_CODE]: z
    .string()
    .trim()
    .min(1, "Mã khách hàng không được để trống"),
  [OrderKey.PARTNER_NAME]: z.string().trim().nullish().default(null),
  [OrderKey.PARTNER_PHONE]: z.string().trim().nullish().default(null),
  [OrderKey.EMPLOYEE_CODE]: z.string().trim().nullish().default(null),
  [OrderKey.ORDER_AT]: DateTransform.nullish()
    .transform((val) => val || new Date())
    .default(new Date()),

  // Order discount
  [OrderKey.DISCOUNT_TYPE]: z
    .string()
    .trim()
    .nullish()
    .transform((val) => {
      if (!val) return DiscountTypeEnum.AMOUNT;
      const lower = val.toLowerCase();
      if (
        lower === "percent" ||
        lower === "%" ||
        lower === "phần trăm" ||
        lower === "phan tram"
      ) {
        return DiscountTypeEnum.PERCENT;
      }
      return DiscountTypeEnum.AMOUNT; // "số tiền", "amount", etc.
    })
    .default(DiscountTypeEnum.AMOUNT),
  [OrderKey.DISCOUNT_VALUE]: z.number().min(0).nullish().default(null),

  // Shipping
  [OrderKey.SHIPPING_PROVIDER_CODE]: z.string().trim().nullish().default(null),
  [OrderKey.SHIPPING_FEE]: z.number().min(0).nullish().default(null),
  [OrderKey.IS_FREE_SHIPPING]: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") {
        const lower = val.toLowerCase().trim();
        return ["true", "yes", "có", "co", "1", "x"].includes(lower);
      }
      return false;
    })
    .default(false),

  // Loyalty points
  [OrderKey.LOYALTY_POINTS_USED]: z.number().min(0).nullish().default(0),

  // OrderLine fields
  [OrderLineKey.PRODUCT_VARIANT_CODE]: z
    .string()
    .trim()
    .min(1, "Mã sản phẩm không được để trống"),
  [OrderLineKey.PRODUCT_VARIANT_NAME]: z
    .string()
    .trim()
    .nullish()
    .default(null),
  [OrderLineKey.SPECIFICATION]: z.string().trim().nullish().default(null),
  [OrderLineKey.UNIT_PRICE]: z.number().min(0, "Đơn giá phải >= 0"),
  [OrderLineKey.QUANTITY]: z.number().min(0.001, "Số lượng phải > 0"),
  [OrderLineKey.LINE_DISCOUNT_TYPE]: z
    .string()
    .trim()
    .nullish()
    .transform((val) => {
      if (!val) return DiscountTypeEnum.AMOUNT;
      const lower = val.toLowerCase();
      if (
        lower === "percent" ||
        lower === "%" ||
        lower === "phần trăm" ||
        lower === "phan tram"
      ) {
        return DiscountTypeEnum.PERCENT;
      }
      return DiscountTypeEnum.AMOUNT; // "số tiền", "amount", etc.
    })
    .default(DiscountTypeEnum.AMOUNT),
  [OrderLineKey.LINE_DISCOUNT_VALUE]: z.number().min(0).nullish().default(null),
  [OrderLineKey.TAX_RATE]: z.number().min(0).max(100).nullish().default(null),
});

export type ValidatedSaleOrderRow = z.infer<typeof SaleOrderRowSchema>;
export type ValidatedSaleOrderLine = z.infer<typeof SaleOrderLineRowSchema>;
