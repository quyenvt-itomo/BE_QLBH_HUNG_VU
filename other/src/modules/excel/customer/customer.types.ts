import { ExportColumnConfig } from "../excel.types";

export enum CustomerKey {
  // String keys
  TYPE = "type", // Cá nhân hoặc tổ chức
  CODE = "code",
  NAME = "name",
  PHONE = "phone",
  EMAIL = "email",
  ADDRESS = "address", // Địa chỉ Tỉnh/Thành phố - Phường/Xã
  DETAIL_ADDRESS = "detailAddress", // Địa chỉ chi tiết
  TAX_CODE = "taxCode",
  GROUP = "group", // Nhóm khách hàng (nếu có)
  NOTE = "note",
  // Number keys
  CURRENT_REVENUE = "currentRevenue", // Doanh số tích lũy hiện có
  CURRENT_LOYALTY_POINTS = "currentLoyaltyPoints", // Điểm tích lũy hiện có
  RECEIVABLE_AMOUNT = "receivableAmount", // Số tiền đang nợ (nếu có)
}

export type RawCustomerRow = {
  _rowNumber: number;
  [CustomerKey.TYPE]: string;
  [CustomerKey.CODE]: string;
  [CustomerKey.NAME]: string;
  [CustomerKey.PHONE]?: string;
  [CustomerKey.EMAIL]?: string;
  [CustomerKey.ADDRESS]?: string;
  [CustomerKey.DETAIL_ADDRESS]?: string;
  [CustomerKey.TAX_CODE]?: string;
  [CustomerKey.GROUP]?: string;
  [CustomerKey.NOTE]?: string;
  [CustomerKey.CURRENT_REVENUE]?: number;
  [CustomerKey.CURRENT_LOYALTY_POINTS]?: number;
  [CustomerKey.RECEIVABLE_AMOUNT]?: number;
};

export const CUSTOMER_COLUMNS: ExportColumnConfig<CustomerKey>[] = [
  {
    field: CustomerKey.TYPE,
    header: "Loại khách hàng",
    width: 20,
    type: "string",
  },
  {
    field: CustomerKey.CODE,
    header: "Mã khách hàng",
    width: 20,
  },
  {
    field: CustomerKey.NAME,
    header: "Tên khách hàng",
    width: 30,
    required: true,
  },
  {
    field: CustomerKey.PHONE,
    header: "Số điện thoại",
    width: 20,
  },
  {
    field: CustomerKey.EMAIL,
    header: "Email",
    width: 30,
  },
  {
    field: CustomerKey.ADDRESS,
    header: "Địa chỉ",
    width: 50,
  },
  {
    field: CustomerKey.DETAIL_ADDRESS,
    header: "Địa chỉ chi tiết",
    width: 50,
  },
  {
    field: CustomerKey.TAX_CODE,
    header: "Mã số thuế",
    width: 20,
  },
  {
    field: CustomerKey.GROUP,
    header: "Nhóm khách hàng",
    width: 20,
  },
  {
    field: CustomerKey.NOTE,
    header: "Ghi chú",
    width: 30,
  },
  {
    field: CustomerKey.CURRENT_REVENUE,
    header: "Doanh số hiện tại",
    width: 25,
  },
  {
    field: CustomerKey.CURRENT_LOYALTY_POINTS,
    header: "Điểm tích lũy",
    width: 25,
  },
  {
    field: CustomerKey.RECEIVABLE_AMOUNT,
    header: "Số tiền đang nợ",
    width: 25,
  },
] as const;
