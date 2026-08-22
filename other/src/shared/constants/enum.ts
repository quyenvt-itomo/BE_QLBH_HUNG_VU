import { Module } from "../middleware/permission.middleware";

export enum Provider {
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple",
  YAHOO = "yahoo",
}

export const VAT_CATEGORY_NAME = "Nộp thuế VAT";
export const INCOME_SALE_CATEGORY_NAME = "Thu tiền khách hàng";
export const INCOME_PURCHASE_CATEGORY_NAME = "NCC hoàn tiền";
export const EXPENSE_PURCHASE_CATEGORY_NAME = "Trả tiền NCC";
export const EXPENSE_SALE_CATEGORY_NAME = "Hoàn tiền khách hàng";

export enum AttributeTypeEnum {
  PRODUCT_CATEGORY = "product_category", // Loại sản phẩm
  PRODUCT_UNIT = "product_unit", // Đơn vị tính
  PRODUCT_TYPE = "product_type", // Loại hàng hóa

  CUSTOMER_GROUP = "customer_group",
  SUPPLIER_GROUP = "supplier_group",
  SHIPPER_GROUP = "shipper_group",

  EMPLOYEE_POSITION = "employee_position",

  INCOME_CATEGORY = "income_category",
  EXPENSE_CATEGORY = "expense_category",
}
export const attributeModuleMap: Record<AttributeTypeEnum, Module> = {
  [AttributeTypeEnum.PRODUCT_CATEGORY]: "category",
  [AttributeTypeEnum.PRODUCT_UNIT]: "unit",
  [AttributeTypeEnum.PRODUCT_TYPE]: "productType",

  [AttributeTypeEnum.CUSTOMER_GROUP]: "category",
  [AttributeTypeEnum.SUPPLIER_GROUP]: "category",
  [AttributeTypeEnum.SHIPPER_GROUP]: "category",

  [AttributeTypeEnum.EMPLOYEE_POSITION]: "position",

  [AttributeTypeEnum.INCOME_CATEGORY]: "category",
  [AttributeTypeEnum.EXPENSE_CATEGORY]: "category",
};

export enum NotificationTypeEnum {}

export enum ActionTypeEnum {}

export enum EntityTypeEnum {
  AUTH = "auth",
  USER = "user",
  PARTNER = "partner",
  TRANSACTION = "transaction",
  CATEGORY = "category",
  CATEGORY_GROUP = "categoryGroup",
  FUND = "fund",
  LOCATION = "location",
  REPORT = "report",
  SETTINGS = "settings",
  NOTIFICATION = "notification",
  TENANT = "tenant",
  EMPLOYEE = "employee",
  ROLE = "role",
  PERMISSION = "permission",
  PRODUCT = "product",
  PRODUCT_ATTRIBUTE = "productAttribute",
  PRODUCT_ATTRIBUTE_VALUE = "productAttributeValue",
  PRODUCT_VARIANT = "productVariant",
  PRODUCT_OPTION = "productOption",
  PRODUCT_UNIT = "productUnit",
  OPENING_STOCK = "openingStock",
  INVENTORY_TRANSACTION = "inventoryTransaction",
  INVENTORY = "inventory",
  ATTRIBUTE = "attribute",
  CUSTOMER = "customer",
  SUPPLIER = "supplier",
  SHIPPER = "shipper",
  MANUFACTURER = "manufacturer",
  DISTRIBUTOR = "distributor",
  STORE = "store",
  EXCEL_IMPORT = "excelImport",
}

export enum GenderEnum {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum VerifyOtpTypeEnum {
  REGISTER = "register",
  FORGOT_PASSWORD = "forgot_password",
  EMAIL_CHANGE = "email_change",
  PHONE_CHANGE = "phone_change",
  PASSWORD_CHANGE = "password_change",
}

export enum PartnerTypeEnum {
  CUSTOMER = "customer", // khách hàng
  SUPPLIER = "supplier", // nhà cung cấp
  SHIPPER = "shipper", // đơn vị vận chuyển
}

export enum FileTypeEnum {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
  OTHER = "other",
}

export enum FileCategoryEnum {
  AVATAR = "avatar",
  RECEIPT = "receipt",
  ATTACHMENT = "attachment",
  DOCUMENT = "document",
  LOGO = "logo",
  IMAGE = "image",
  VIDEO = "video",
  ALBUM = "album",
  MEDIA = "media",
}

export enum FileStatusEnum {
  PENDING = "pending",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export enum EmployeeStatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
  INVITED = "invited",
  TERMINATED = "terminated",
}

export enum DiscountTypeEnum {
  AMOUNT = "amount",
  PERCENT = "percent",
}

// TODO: Order
export enum OrderTypeEnum {
  PURCHASE = "purchase",
  SALE = "sale",

  PURCHASE_RETURN = "purchase_return", // trả NCC
  SALE_RETURN = "sale_return", // khách trả
}

export enum OrderLineTypeEnum {
  NORMAL = "normal", // Dòng bình thường (mua/bán)
  RETURN = "return", // Dòng trả hàng (có refOrderLineId)
}

export enum OrderStatusEnum {
  DRAFT = "draft", // nháp
  POSTED = "posted", // đã duyệt
  CANCELLED = "cancelled", // đã hủy
}

// Loyalty Points Transaction Type
export enum LoyaltyPointTransactionTypeEnum {
  INCREASE = "increase", // Tăng điểm
  DECREASE = "decrease", // Giảm điểm
}

export enum LoyaltyPointRefTypeEnum {
  ORDER = "order", // Từ đơn hàng (SALE hoặc SALE_RETURN)
  ADJUSTMENT = "adjustment", // Điều chỉnh thủ công
}

// TODO: Inventory
export enum InventoryTransactionTypeEnum {
  IN = "in",
  OUT = "out",
}
export enum InventoryRefTypeEnum {
  PURCHASE = "purchase",
  SALE = "sale",
  PURCHASE_RETURN = "purchase_return",
  SALE_RETURN = "sale_return",
  TRANSFER = "transfer",
  ADJUST = "adjust",
}

// TODO: Fund
export enum FundTypeEnum {
  CASH = "cash",
  BANK = "bank",
}
export enum IncomeExpenseTypeEnum {
  INCOME = "income", // Thu
  EXPENSE = "expense", // Chi
}
export enum FundTransactionTypeEnum {
  INCREASE = "increase",
  DECREASE = "decrease",
}
export enum FundTransactionRefTypeEnum {
  INCOME = "income",
  EXPENSE = "expense",
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
}

// TODO: Debt
export enum PartnerDebtSideEnum {
  PAYABLE = "payable", // phải trả
  RECEIVABLE = "receivable", // phải thu
}

export enum DebtDirectionEnum {
  INCREASE = "increase", // tăng nợ
  DECREASE = "decrease", // giảm nợ
}

export enum DebtRefTypeEnum {
  PURCHASE = "purchase", // nhập hàng
  SALE = "sale", // bán hàng
  PURCHASE_RETURN = "purchase_return", // trả hàng NCC
  SALE_RETURN = "sale_return", // khách trả hàng

  INCOME = "income", // thu
  EXPENSE = "expense", // chi
  DEBT_OFFSET = "debt_offset", // đối trừ công nợ
  ADJUSTMENT = "adjustment", // điều chỉnh công nợ

  SHIPPING_FEE = "shipping_fee", // phí vận chuyển
}

export const CHECKLIST_KEY = [
  "printer",
  "internet",
  "inventory",
  "handover",
] as const;
export type ChecklistKey = (typeof CHECKLIST_KEY)[number];
export const checklistKeyMap: Record<ChecklistKey, string> = {
  printer: "Máy in hoạt động",
  internet: "Internet ổn định",
  inventory: "Kiểm tra nguyên liệu",
  handover: "Nhận bàn giao từ ca trước",
};

export enum ShiftStatusEnum {
  ACTIVE = "active",
  CLOSED = "closed",
}

export enum StoreTransferStatusEnum {
  PENDING = "pending",
  EXPORTED = "exported",
  RECEIVED = "received",
  CANCELLED = "cancelled",
}
