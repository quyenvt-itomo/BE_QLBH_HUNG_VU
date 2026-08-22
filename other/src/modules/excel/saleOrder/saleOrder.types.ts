import { ExportColumnConfig } from "../excel.types";

/**
 * Enum cho các trường của Order (cột bên trái)
 */
export enum OrderKey {
  CODE = "code", // Mã đơn hàng
  PARTNER_CODE = "partnerCode", // Mã khách hàng
  PARTNER_NAME = "partnerName", // Tên khách hàng (optional, có thể dùng để tạo mới)
  PARTNER_PHONE = "partnerPhone", // SĐT khách hàng (optional)
  EMPLOYEE_CODE = "employeeCode", // Mã nhân viên
  EMPLOYEE_NAME = "employeeName", // Tên nhân viên
  ORDER_AT = "orderAt", // Ngày thực hiện đơn

  // Discount (order-level)
  DISCOUNT_TYPE = "discountType", // Số tiền | %
  DISCOUNT_VALUE = "discountValue", // % hoặc số tiền

  // Shipping
  SHIPPING_PROVIDER_CODE = "shippingProviderCode", // Mã nhà vận chuyển
  SHIPPING_FEE = "shippingFee", // Phí vận chuyển
  IS_FREE_SHIPPING = "isFreeShipping", // Miễn phí vận chuyển

  // Loyalty points
  LOYALTY_POINTS_USED = "loyaltyPointsUsed", // Điểm khách dùng

  // Calculated fields (order-level)
  GROSS_AMOUNT = "grossAmount", // Tổng tiền hàng
  LINE_DISCOUNT_AMOUNT = "lineDiscountAmount", // Giảm giá sản phẩm
  ORDER_DISCOUNT_AMOUNT = "orderDiscountAmount", // Giảm giá đơn hàng
  NET_AMOUNT = "netAmount", // Tổng sau giảm giá
  TAX_AMOUNT = "taxAmount", // Tiền VAT
  TOTAL_AMOUNT = "totalAmount", // Tổng đơn hàng
}

/**
 * Enum cho các trường của OrderLine (cột bên phải)
 */
export enum OrderLineKey {
  PRODUCT_VARIANT_CODE = "productVariantCode", // Mã sản phẩm/SKU
  PRODUCT_VARIANT_NAME = "productVariantName", // Tên sản phẩm
  SPECIFICATION = "specification", // Quy cách (Size: M - Màu: Đỏ)
  UNIT_PRICE = "unitPrice", // Đơn giá
  QUANTITY = "quantity", // Số lượng

  // Discount (line-level)
  LINE_DISCOUNT_TYPE = "lineDiscountType", // Số tiền | %
  LINE_DISCOUNT_VALUE = "lineDiscountValue", // Giá trị giảm

  // Tax
  TAX_RATE = "taxRate", // % thuế (0, 8, 10)

  // Calculated fields (line-level)
  SUB_TOTAL = "subTotal", // Thành tiền (giá × số lượng)
  DISCOUNT_AMOUNT = "lineDiscAmount", // Giảm giá dòng (đã tính)
  ORDER_DISCOUNT_AMOUNT = "lineOrdDiscAmount", // Giảm giá ĐH phân bổ
  NET_AMOUNT = "lineNetAmount", // Thành tiền sau giảm
  TAX_AMOUNT = "lineTaxAmount", // Tiền VAT dòng
  TOTAL_AMOUNT = "lineTotalAmount", // Tổng tiền dòng
}

/**
 * Raw row từ Excel - chứa cả thông tin order và line
 */
export type RawSaleOrderRow = {
  _rowNumber: number;

  // Order fields
  [OrderKey.CODE]: string;
  [OrderKey.PARTNER_CODE]: string;
  [OrderKey.PARTNER_NAME]?: string;
  [OrderKey.PARTNER_PHONE]?: string;
  [OrderKey.EMPLOYEE_CODE]?: string;
  [OrderKey.ORDER_AT]?: string | Date;
  [OrderKey.DISCOUNT_TYPE]?: string;
  [OrderKey.DISCOUNT_VALUE]?: number;
  [OrderKey.SHIPPING_PROVIDER_CODE]?: string;
  [OrderKey.SHIPPING_FEE]?: number;
  [OrderKey.IS_FREE_SHIPPING]?: boolean | string;
  [OrderKey.LOYALTY_POINTS_USED]?: number;

  // OrderLine fields
  [OrderLineKey.PRODUCT_VARIANT_CODE]: string;
  [OrderLineKey.PRODUCT_VARIANT_NAME]?: string;
  [OrderLineKey.SPECIFICATION]?: string;
  [OrderLineKey.UNIT_PRICE]: number;
  [OrderLineKey.QUANTITY]: number;
  [OrderLineKey.LINE_DISCOUNT_TYPE]?: string;
  [OrderLineKey.LINE_DISCOUNT_VALUE]?: number;
  [OrderLineKey.TAX_RATE]?: number;
};

/**
 * Template columns - order info trước, line info sau
 */
export const SALE_ORDER_COLUMNS: ExportColumnConfig<OrderKey | OrderLineKey>[] =
  [
    // ===== ORDER INFO (LEFT) =====
    {
      field: OrderKey.CODE,
      header: "Mã đơn hàng",
      width: 20,
      required: true,
      type: "string",
    },
    {
      field: OrderKey.PARTNER_CODE,
      header: "Mã khách hàng",
      width: 20,
      required: true,
      type: "string",
    },
    {
      field: OrderKey.PARTNER_NAME,
      header: "Tên khách hàng",
      width: 25,
      type: "string",
    },
    {
      field: OrderKey.PARTNER_PHONE,
      header: "SĐT",
      width: 15,
      type: "string",
    },
    {
      field: OrderKey.EMPLOYEE_CODE,
      header: "Mã nhân viên",
      width: 15,
      type: "string",
    },
    {
      field: OrderKey.EMPLOYEE_NAME,
      header: "Tên nhân viên",
      width: 25,
      type: "string",
    },
    {
      field: OrderKey.ORDER_AT,
      header: "Ngày đơn hàng",
      width: 20,
      type: "date",
    },
    {
      field: OrderKey.DISCOUNT_TYPE,
      header: "Loại giảm giá ĐH",
      width: 18,
      type: "string",
    },
    {
      field: OrderKey.DISCOUNT_VALUE,
      header: "Giá trị giảm ĐH",
      width: 18,
      type: "number",
    },
    {
      field: OrderKey.SHIPPING_PROVIDER_CODE,
      header: "Mã ĐVVC",
      width: 15,
      type: "string",
    },
    {
      field: OrderKey.SHIPPING_FEE,
      header: "Phí vận chuyển",
      width: 15,
      type: "number",
    },
    {
      field: OrderKey.IS_FREE_SHIPPING,
      header: "Miễn phí VC",
      width: 12,
      type: "boolean",
    },
    {
      field: OrderKey.LOYALTY_POINTS_USED,
      header: "Điểm sử dụng",
      width: 15,
      type: "number",
    },
    {
      field: OrderKey.GROSS_AMOUNT,
      header: "Tổng tiền hàng",
      width: 18,
      type: "number",
    },
    {
      field: OrderKey.LINE_DISCOUNT_AMOUNT,
      header: "Giảm giá SP",
      width: 18,
      type: "number",
    },
    {
      field: OrderKey.ORDER_DISCOUNT_AMOUNT,
      header: "Giảm giá ĐH",
      width: 18,
      type: "number",
    },
    {
      field: OrderKey.NET_AMOUNT,
      header: "Tổng sau giảm",
      width: 18,
      type: "number",
    },
    {
      field: OrderKey.TAX_AMOUNT,
      header: "Tiền VAT",
      width: 18,
      type: "number",
    },
    {
      field: OrderKey.TOTAL_AMOUNT,
      header: "Tổng đơn hàng",
      width: 18,
      type: "number",
    },

    // ===== ORDER LINE INFO (RIGHT) =====
    {
      field: OrderLineKey.PRODUCT_VARIANT_CODE,
      header: "Mã sản phẩm/SKU",
      width: 20,
      required: true,
      type: "string",
    },
    {
      field: OrderLineKey.PRODUCT_VARIANT_NAME,
      header: "Tên sản phẩm",
      width: 30,
      type: "string",
    },
    {
      field: OrderLineKey.SPECIFICATION,
      header: "Quy cách",
      width: 20,
      type: "string",
    },
    {
      field: OrderLineKey.UNIT_PRICE,
      header: "Đơn giá",
      width: 15,
      required: true,
      type: "number",
    },
    {
      field: OrderLineKey.QUANTITY,
      header: "Số lượng",
      width: 12,
      required: true,
      type: "number",
    },
    {
      field: OrderLineKey.LINE_DISCOUNT_TYPE,
      header: "Loại giảm giá dòng",
      width: 18,
      type: "string",
    },
    {
      field: OrderLineKey.LINE_DISCOUNT_VALUE,
      header: "Giá trị giảm dòng",
      width: 18,
      type: "number",
    },
    {
      field: OrderLineKey.TAX_RATE,
      header: "%VAT",
      width: 10,
      type: "number",
    },
    {
      field: OrderLineKey.SUB_TOTAL,
      header: "Thành tiền dòng",
      width: 18,
      type: "number",
    },
    {
      field: OrderLineKey.DISCOUNT_AMOUNT,
      header: "Giảm giá dòng",
      width: 18,
      type: "number",
    },
    {
      field: OrderLineKey.ORDER_DISCOUNT_AMOUNT,
      header: "Giảm giá ĐH (phân bổ)",
      width: 20,
      type: "number",
    },
    {
      field: OrderLineKey.NET_AMOUNT,
      header: "Sau giảm dòng",
      width: 18,
      type: "number",
    },
    {
      field: OrderLineKey.TAX_AMOUNT,
      header: "VAT dòng",
      width: 15,
      type: "number",
    },
    {
      field: OrderLineKey.TOTAL_AMOUNT,
      header: "Tổng tiền dòng",
      width: 18,
      type: "number",
    },
  ] as const;
