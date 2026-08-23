export const nullUuidMap = {
  incomeCategory: "00000000-0000-4000-8000-000000000001",
  expenseCategory: "00000000-0000-4000-8000-000000000002",
};

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum IdentificationType {
  CCCD = "CCCD", // Căn cước công dân
  CMND = "CMND", // Chứng minh nhân dân
  HC = "HC", // Hộ chiếu
}

export enum TransactionType {
  IN = "in",
  OUT = "out",
}

export enum DiscountTypeEnum {
  AMOUNT = "amount",
  PERCENT = "percent",
}
export enum ApproveStatus {
  PENDING = "PENDING", // Đang chờ duyệt
  APPROVED = "APPROVED", // Đã duyệt
  REJECTED = "REJECTED", // Bị từ chối

  // Dành cho đơn bán hàng
  CUSTOMER_APPROVED = "CUSTOMER_APPROVED", // Khách hàng đã duyệt (đối với đơn bán hàng cần khách hàng duyệt)
  CUSTOMER_REJECTED = "CUSTOMER_REJECTED", // Khách hàng đã từ chối (đối với đơn bán hàng cần khách hàng duyệt)
}

export enum CommissionMode {
  PRICE = "PRICE", // Tính hoa hồng dựa trên giá bán
  QUANTITY = "QUANTITY", // Tính hoa hồng dựa trên số lượng
}

export enum SaleLineTypeEnum {
  PRODUCT = "product",
  SERVICE = "service",
}

export const STEEL_DENSITY = 7.85; // g/cm3 // Khối lượng riêng của thép, dùng để tính trọng lượng từ thể tích
export const PI = Math.PI;
export const STEEL_WEIGHT_FACTOR = (PI * STEEL_DENSITY) / 1000;
