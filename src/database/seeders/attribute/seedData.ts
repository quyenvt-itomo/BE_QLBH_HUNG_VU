import {
  Attribute,
  DEFAULT_AREA_UNIT,
  DEFAULT_MESH_UNIT,
  DEFAULT_WEIGHT_UNIT,
} from "@/database/models/Attribute";
import {
  AttributeType,
  INCOME_CUSTOMER,
  INCOME_DEPOSIT,
  INCOME_WITHDRAW,
  INCOME_CAPITAL_CONTRIBUTION,
  EXPENSE_PAYMENT_REQUEST,
  EXPENSE_LOAN,
  EXPENSE_INTEREST,
  EXPENSE_VAT,
  EXPENSE_CAPITAL_WITHDRAWAL,
  EXPENSE_PROFIT_DISTRIBUTION,
} from "@/database/models/Attribute";
import { DeepPartial } from "typeorm";

export const operationSeeder = [
  "Lưới thép hàn D8a100x190",
  "Lưới thép hàn D8a183x190",
  "Hàn lưới thép d14a100",
  "Hàn lưới thép d14a150",
  "Hàn lưới thép d14a200",
  "Hàn lưới thép d13a100",
  "Hàn lưới thép d13a150",
  "Hàn lưới thép d13a200",
  "Hàn lưới thép d12a100",
  "Hàn lưới thép d12a150",
  "Hàn lưới thép d12a200",
  "Hàn lưới thép d11a100",
  "Hàn lưới thép d11a150",
  "Hàn lưới thép d11a200",
  "Hàn lưới thép d10a100",
  "Hàn lưới thép d10a150",
  "Hàn lưới thép d10a200",
  "Hàn lưới thép d9a100",
  "Hàn lưới thép d9a150",
  "Hàn lưới thép d9a200",
  "Hàn lưới thép d8a100",
  "Hàn lưới thép d8a150",
  "Hàn lưới thép d8a200",
  "Hàn lưới thép d7a100",
  "Hàn lưới thép d7a150",
  "Hàn lưới thép d7a200",
  "Hàn lưới thép d6a100",
  "Hàn lưới thép d6a150",
  "Hàn lưới thép d6a200",
  "Hàn lưới thép d5a100",
  "Hàn lưới thép d5a150",
  "Hàn lưới thép d5a200",
  "Hàn lưới thép d4a100",
  "Hàn lưới thép d4a150",
  "Hàn lưới thép d4a200",
  "Kéo thép đai, có bó buộc",
  "Cắt đoạn thép 8.5 đến 14",
  "Kéo thép 8.5 đến 14, không bó buộc",
  "Kéo thép 8.5 đến 14, có bó buộc",
  "Cắt đoạn thép 7.1 đến 8",
  "Cắt đoạn thép 6.5 đến 7",
  "Kéo thép 6.5 đến 8, không bó buộc",
  "Kéo thép 6.5 đến 8, có bó buộc",
  "Cắt đoạn thép 5.4 đến 6",
  "Cắt đoạn thép 4.7 đến 5.3",
  "Kéo thép 4.7 đến 6, không bó buộc",
  "Kéo thép 4.7 đến 6, có bó buộc",
  "Cắt đoạn thép 4.3 đến 4.6",
  "Kéo thép 4.3 đến 4.6, không bó buộc",
  "Kéo thép 4.3 đến 4.6, có bó buộc",
  "Cắt đoạn thép 3.6 đến 4.2",
  "Kéo thép 3.6 đến 4.2, không bó buộc",
  "Kéo thép 3.6 đến 4.2, có bó buộc",
  "Kéo thép 2.5 đến 3.5, không bó buộc",
  "Kéo thép 2.5 đến 3.5, có bó buộc",
  "Cắt đoạn thép",
  "Hàn lưới thép",
  "Kéo thép để hàn lưới",
];

export const finishedGroupSeeder = [
  "Than cốc",
  "Thép kéo nguội",
  "Cuộn lưới thép hàn",
  "Lưới thép hàn",
  "Thảm đá",
  "Rọ đá",
  "Lưới thép hàn dạng cuộn",
  "Thép kéo nguội dạng thanh",
  "Lưới thép hàn dạng tấm",
  "Thép kéo nguội dạng cuộn",
];

export const mainMaterialGroupSeeder = [
  "Thép D6",
  "Thép D6.5",
  "Thép D7",
  "Thép D8",
  "Thép D9",
  "Thép D10",
  "Thép D11",
  "Thép D12",
  "Thép D14",
  "Thép D16",
];

export const subMaterialGroupSeeder = [
  "Bột",
  "Than",
  "Dây curoa",
  "Khuôn thường",
  "Khuôn kim cương",
  "Nhôm tấm dày 10x50x200mm",
  "Đồng thanh đỏ 40x60x660mm",
];

export const toolsGroupSeeder = [
  "Dụng cụ lao động",
  "Đồ bảo hộ lao động",
  "Máy móc thiết bị",
];

export const unitSeeder = [
  DEFAULT_WEIGHT_UNIT,
  DEFAULT_MESH_UNIT,
  DEFAULT_AREA_UNIT,
  "Kg Bazem",
  "Tấn",
  "Thanh",
  "Cuộn",
  "Bó",
  "Chuyến",
];

export const partnerGroupSeeder = [
  "Nhà cung cấp nguyên liệu chính",
  "Nhà cung cấp nguyên liệu phụ",
  "Thi công",
  "Vận tải",
];

export const jobTitleSeeder = [
  "Tổ trưởng",
  "Công nhân",
  "Phó Giám đốc",
  "Giám đốc",
  "Nhân viên",
  "Trưởng phòng",
];

export const defaultIncomeCategorySeeder = [
  INCOME_CUSTOMER,
  INCOME_DEPOSIT,
  INCOME_WITHDRAW,
  INCOME_CAPITAL_CONTRIBUTION,
];
export const defaultExpenseCategorySeeder = [
  EXPENSE_PAYMENT_REQUEST,
  EXPENSE_LOAN,
  EXPENSE_INTEREST,
  EXPENSE_VAT,
  EXPENSE_CAPITAL_WITHDRAWAL,
  EXPENSE_PROFIT_DISTRIBUTION,
];

export const attributeSeeders: DeepPartial<Attribute>[] = [
  ...operationSeeder.map((name) => ({
    name,
    type: AttributeType.OPERATION,
  })),

  ...finishedGroupSeeder.map((name) => ({
    name,
    type: AttributeType.FINISHED_GROUP,
  })),

  ...mainMaterialGroupSeeder.map((name) => ({
    name,
    type: AttributeType.MAIN_MATERIAL_GROUP,
  })),

  ...subMaterialGroupSeeder.map((name) => ({
    name,
    type: AttributeType.SUB_MATERIAL_GROUP,
  })),

  ...unitSeeder.map((name) => ({
    name,
    type: AttributeType.UNIT,
    isDefault: true,
  })),

  ...partnerGroupSeeder.map((name) => ({
    name,
    type: AttributeType.PARTNER_GROUP,
  })),

  ...jobTitleSeeder.map((name) => ({
    name,
    type: AttributeType.JOB_TITLE,
  })),

  ...defaultIncomeCategorySeeder.map((name) => ({
    name,
    type: AttributeType.INCOME_CATEGORY,
    isDefault: true,
  })),

  ...defaultExpenseCategorySeeder.map((name) => ({
    name,
    type: AttributeType.EXPENSE_CATEGORY,
    isDefault: true,
  })),
];
