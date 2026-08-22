import {
  AttributeTypeEnum,
  EXPENSE_PURCHASE_CATEGORY_NAME,
  EXPENSE_SALE_CATEGORY_NAME,
  INCOME_PURCHASE_CATEGORY_NAME,
  INCOME_SALE_CATEGORY_NAME,
  VAT_CATEGORY_NAME,
} from "@/shared/constants/enum";
import { Attribute } from "../models/Attribute";
import { DeepPartial } from "typeorm";

export const producCategorySeeder = [
  "Áo sơ mi",
  "Quần tây",
  "Váy đầm",
  "Giày dép",
  "Phụ kiện thời trang",
  "Áo khoác",
  "Đồ thể thao",
  "Đồ lót",
  "Trang phục công sở",
  "Trang phục dạo phố",
];
export const productUnitSeeder = [
  "Cái",
  "Chiếc",
  "Bộ",
  "Đôi",
  "Set",
  "Hộp",
  "Kg",
];
export const productTypeSeeder = [
  "Chất liệu",
  "Màu sắc",
  "Kích cỡ",
  "Kiểu dáng",
  "Nhãn hiệu",
  "Xuất xứ",
  "Phân loại theo mùa",
  "Giới tính",
  "Độ tuổi",
  "Phong cách",
  "Loại hình sử dụng",
];

export const customerGroupSeeder = ["Khách hàng lẻ", "Khách hàng lâu năm"];
export const supplierGroupSeeder = [
  "Nhà cung cấp lẻ",
  "Nhà cung cấp sỉ",
  "Nhà cung cấp phụ kiện",
  "Nhà cung cấp đồ thể thao",
  "Nhà cung cấp giày dép",
  "Nhà cung cấp thời trang công sở",
];
export const shipperGroupSeeder = [
  "Shipper nội thành",
  "Shipper ngoại thành",
  "Đơn vị vận chuyển nhanh",
  "Đơn vị vận chuyển tiết kiệm",
];

export const employeePositionSeeder = [
  "Nhân viên bán hàng",
  "Quản lý cửa hàng",
  "Thu ngân",
  "Nhân viên kho",
  "Nhân viên marketing",
  "Giám đốc điều hành",
];

export const incomeCategorySeeder = [
  "Doanh thu dịch vụ",
  "Thu nhập từ đầu tư",
  "Thu nhập khác",
];
export const expenseCategorySeeder = [
  "Chi phí nhân công",
  "Chi phí vận hành",
  "Chi phí marketing",
  "Chi phí thuê mặt bằng",
  "Chi phí tiện ích",
  "Chi phí khấu hao",
  "Chi phí khác",
];

export const attributeSeeders: DeepPartial<Attribute>[] = [
  ...producCategorySeeder.map((name) => ({
    name,
    type: AttributeTypeEnum.PRODUCT_CATEGORY,
  })),
  ...productUnitSeeder.map((name) => ({
    name,
    type: AttributeTypeEnum.PRODUCT_UNIT,
  })),
  ...productTypeSeeder.map((name) => ({
    name,
    type: AttributeTypeEnum.PRODUCT_TYPE,
  })),

  ...customerGroupSeeder.map((name) => ({
    name,
    type: AttributeTypeEnum.CUSTOMER_GROUP,
  })),
  ...supplierGroupSeeder.map((name) => ({
    name,
    type: AttributeTypeEnum.SUPPLIER_GROUP,
  })),
  ...shipperGroupSeeder.map((name) => ({
    name,
    type: AttributeTypeEnum.SHIPPER_GROUP,
  })),

  ...employeePositionSeeder.map((name) => ({
    name,
    type: AttributeTypeEnum.EMPLOYEE_POSITION,
  })),

  {
    name: "Doanh thu bán hàng",
    type: AttributeTypeEnum.INCOME_CATEGORY,
    isDefault: true,
    fundCategories: [{ name: INCOME_SALE_CATEGORY_NAME, isDefault: true }],
  },
  {
    name: "Giảm chi phí",
    type: AttributeTypeEnum.INCOME_CATEGORY,
    isDefault: true,
    fundCategories: [{ name: INCOME_PURCHASE_CATEGORY_NAME, isDefault: true }],
  },
  ...incomeCategorySeeder.map((name) => ({
    name,
    type: AttributeTypeEnum.INCOME_CATEGORY,
  })),

  {
    name: "Thanh toán công nợ",
    type: AttributeTypeEnum.EXPENSE_CATEGORY,
    isDefault: true,
    fundCategories: [
      { name: EXPENSE_PURCHASE_CATEGORY_NAME, isDefault: true },
      { name: VAT_CATEGORY_NAME, isDefault: true },
    ],
  },
  {
    name: "Giảm doanh thu",
    type: AttributeTypeEnum.EXPENSE_CATEGORY,
    isDefault: true,
    fundCategories: [{ name: EXPENSE_SALE_CATEGORY_NAME, isDefault: true }],
  },
  ...expenseCategorySeeder.map((name) => ({
    name,
    type: AttributeTypeEnum.EXPENSE_CATEGORY,
  })),
];
