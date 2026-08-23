import { DeepPartial } from "typeorm";
import { Attribute, AttributeType } from "@/database/models/Attribute";

type AttributeSeed = Pick<Attribute, "name" | "type"> & { isDefault?: boolean };

const units = ["Cái", "Chiếc", "Bộ", "Hộp", "Chai", "Lon", "Cuộn", "Mét", "Lít", "Kg", "Thùng"];
const productGroups = [
  "Phụ tùng động cơ",
  "Phụ tùng gầm, phanh và lái",
  "Điện, ắc quy và khởi động",
  "Đèn và điện thân xe",
  "Dầu nhớt và dung dịch",
  "Lốp, săm và phụ kiện bánh xe",
  "Phụ kiện nội ngoại thất",
  "Dụng cụ sửa chữa",
];
const customerGroups = ["Khách lẻ", "Gara sửa chữa", "Doanh nghiệp vận tải"];
const supplierGroups = ["Nhà cung cấp phụ tùng chính hãng", "Nhà cung cấp phụ tùng thay thế", "Nhà cung cấp dầu nhớt và vật tư"];
const shipperGroups = ["Đơn vị vận chuyển", "Nhân viên giao hàng"];
const incomeCategories = ["Bán phụ tùng", "Thu công nợ khách hàng", "Thu khác"];
const expenseCategories = ["Nhập phụ tùng", "Chi phí vận chuyển", "Chi phí cửa hàng", "Chi phí sửa chữa và bảo trì", "Chi khác"];

const map = (names: string[], type: AttributeType, isDefault = false): AttributeSeed[] =>
  names.map((name) => ({ name, type, ...(isDefault ? { isDefault: true } : {}) }));

export const attributeSeeders: DeepPartial<Attribute>[] = [
  ...map(units, AttributeType.UNIT, true),
  ...map(productGroups, AttributeType.PRODUCT_GROUP, true),
  ...map(customerGroups, AttributeType.CUSTOMER_GROUP, true),
  ...map(supplierGroups, AttributeType.SUPPLIER_GROUP, true),
  ...map(shipperGroups, AttributeType.SHIPPER_GROUP, true),
  ...map(incomeCategories, AttributeType.INCOME_CATEGORY, true),
  ...map(expenseCategories, AttributeType.EXPENSE_CATEGORY, true),
];
