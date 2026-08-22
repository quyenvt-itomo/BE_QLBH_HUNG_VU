import { z } from "zod";
import { CustomerKey } from "./customer.types";

/**
 * Layer 1: Schema validation cho import customer từ Excel
 * Sử dụng z.preprocess để transform và validate dữ liệu
 */

// Schema cho một dòng customer trong Excel
export const CustomerExcelRowSchema = z.object({
  _rowNumber: z.number(),

  // Loại khách hàng: string value từ Excel (hoặc null)
  // Sẽ được xử lý trong processor để convert sang isOrganization
  [CustomerKey.TYPE]: z.string().nullish().default(null),

  // Mã khách hàng (tự động tạo nếu không có)
  [CustomerKey.CODE]: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "";
    return val.trim();
  }, z.string().optional()),

  // Tên khách hàng (required) - tự động truncate nếu quá dài
  [CustomerKey.NAME]: z.preprocess(
    (val) => {
      if (!val) return "";
      let name = String(val).trim();
      // Tự động truncate nếu quá 255 ký tự thay vì reject
      if (name.length > 255) {
        name = name.substring(0, 255);
      }
      return name;
    },
    z.string().min(1, "Tên khách hàng không được để trống"),
  ),

  // Số điện thoại (chấp nhận mọi format, tự động clean)
  [CustomerKey.PHONE]: z.preprocess((val) => {
    if (!val) return null;
    const phone = String(val).trim();
    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    return cleaned || null;
  }, z.string().nullable().optional()),

  // Email (lenient: chỉ validate format cơ bản, bỏ qua nếu không hợp lệ, truncate nếu quá dài)
  [CustomerKey.EMAIL]: z.preprocess((val) => {
    if (!val) return null;
    let email = String(val).trim();
    if (!email) return null;

    // Truncate nếu quá dài
    if (email.length > 255) email = email.substring(0, 255);

    // Kiểm tra format email cơ bản (có @ và .)
    // Nếu không hợp lệ, trả về null thay vì throw error
    if (email.includes("@") && email.includes(".")) {
      return email;
    }

    // Nếu không có @ hoặc ., coi như không có email
    return null;
  }, z.string().nullable().optional()),

  // Địa chỉ (Tỉnh/Thành phố - Phường/Xã) - tự động truncate
  [CustomerKey.ADDRESS]: z.preprocess((val) => {
    if (!val) return null;
    let addr = String(val).trim();
    if (addr.length > 255) addr = addr.substring(0, 255);
    return addr || null;
  }, z.string().nullable().optional()),

  // Địa chỉ chi tiết - tự động truncate
  [CustomerKey.DETAIL_ADDRESS]: z.preprocess((val) => {
    if (!val) return null;
    let addr = String(val).trim();
    if (addr.length > 500) addr = addr.substring(0, 500);
    return addr || null;
  }, z.string().nullable().optional()),

  // Mã số thuế - tự động truncate
  [CustomerKey.TAX_CODE]: z.preprocess((val) => {
    if (!val) return null;
    let tax = String(val).trim();
    if (tax.length > 20) tax = tax.substring(0, 20);
    return tax || null;
  }, z.string().nullable().optional()),

  // Nhóm khách hàng - tự động truncate
  [CustomerKey.GROUP]: z.preprocess((val) => {
    if (!val) return null;
    let group = String(val).trim();
    if (group.length > 255) group = group.substring(0, 255);
    return group || null;
  }, z.string().nullable().optional()),

  // Ghi chú
  [CustomerKey.NOTE]: z.preprocess((val) => {
    if (!val) return null;
    return String(val).trim() || null;
  }, z.string().nullable().optional()),

  // Doanh số hiện tại (tự động convert, âm thì set 0)
  [CustomerKey.CURRENT_REVENUE]: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(val);
    if (isNaN(num)) return 0;
    return num < 0 ? 0 : num; // Âm thì set 0
  }, z.number().default(0)),

  // Điểm tích lũy hiện có (tự động convert, âm thì set 0)
  [CustomerKey.CURRENT_LOYALTY_POINTS]: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(val);
    if (isNaN(num)) return 0;
    return num < 0 ? 0 : num; // Âm thì set 0
  }, z.number().default(0)),

  // Số tiền đang nợ (cho phép âm - nợ ngược)
  [CustomerKey.RECEIVABLE_AMOUNT]: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }, z.number().default(0)),
});

export type ValidatedCustomerRow = z.infer<typeof CustomerExcelRowSchema>;

/**
 * Schema cho bulk validation
 */
export const CustomerExcelBulkSchema = z.array(CustomerExcelRowSchema);
