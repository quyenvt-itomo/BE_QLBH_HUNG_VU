import { ExportColumnConfig } from "../excel.types";

export const employeeStatusMap: Record<string, string> = {
  working: "Đang làm việc",
  resigned: "Đã nghỉ việc",
  retired: "Đã nghỉ hưu",
  on_leave: "Nghỉ phép",
  probation: "Thử việc",
  intern: "Thực tập",
  freelance: "Freelance",
};

export const genderMap: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

export const identityTypeMap: Record<string, string> = {
  CCCD: "CCCD",
  CMND: "CMND",
  HC: "Hộ chiếu",
};

export const contractTypeMap: Record<string, string> = {
  official: "Chính thức",
  probation: "Thử việc",
  intern: "Thực tập",
  freelance: "Freelance",
};

// ============================================================
// Sheet names
// ============================================================

export const EMPLOYEE_SHEET_NAMES = {
  MAIN: "Nhân sự",
  ALLOWANCES: "Phụ cấp",
  DEDUCTIONS: "Khấu trừ",
  CONTRACTS: "Hợp đồng",
} as const;

// ============================================================
// Group definitions (2-tier header)
// ============================================================

export interface ColumnGroup {
  name: string;
  columns: ExportColumnConfig[];
}

export const EMPLOYEE_GROUPS: ColumnGroup[] = [
  {
    name: "THÔNG TIN CÁ NHÂN",
    columns: [
      { field: "code", header: "Mã nhân viên (*)", width: 18, required: true },
      { field: "name", header: "Tên nhân viên (*)", width: 30, required: true },
      {
        field: "gender",
        header: "Giới tính",
        width: 12,
        options: Object.values(genderMap),
      },
      { field: "dob", header: "Ngày sinh", width: 16 },
      { field: "maritalStatus", header: "Tình trạng hôn nhân", width: 18 },
      { field: "taxCode", header: "Mã số thuế cá nhân", width: 18 },
      { field: "ethnicity", header: "Dân tộc", width: 15 },
      { field: "religion", header: "Tôn giáo", width: 15 },
    ],
  },
  {
    name: "THÔNG TIN ĐỊNH DANH",
    columns: [
      {
        field: "identityType",
        header: "Loại giấy tờ",
        width: 14,
        options: Object.values(identityTypeMap),
      },
      { field: "identityCode", header: "Số CCCD/CMND/HC", width: 18 },
      { field: "issuedDate", header: "Ngày cấp", width: 16 },
      { field: "issuedPlace", header: "Nơi cấp", width: 25 },
      { field: "expiredDate", header: "Ngày hết hạn", width: 16 },
    ],
  },
  {
    name: "THÔNG TIN LIÊN HỆ",
    columns: [
      { field: "email", header: "Email", width: 28 },
      { field: "phone", header: "SĐT", width: 18 },
    ],
  },
  {
    name: "ĐỊA CHỈ",
    columns: [
      { field: "permanentAddress", header: "Địa chỉ thường trú", width: 45 },
      { field: "currentAddress", header: "Nơi ở hiện tại", width: 45 },
    ],
  },
  {
    name: "LIÊN HỆ KHẨN CẤP",
    columns: [
      { field: "emergencyName", header: "Họ tên", width: 25 },
      { field: "emergencyPhone", header: "SĐT", width: 18 },
      { field: "emergencyRelationship", header: "Quan hệ", width: 18 },
    ],
  },
  {
    name: "CÔNG VIỆC",
    columns: [
      { field: "orgName", header: "Đơn vị công tác", width: 25 },
      { field: "jobPositionName", header: "Vị trí công việc", width: 22 },
      {
        field: "baseSalary",
        header: "Lương cơ bản",
        width: 18,
        type: "number",
        numberFormat: "#,##0",
      },
      { field: "workingStatus", header: "Tình trạng làm việc", width: 18 },
      {
        field: "employeeStatus",
        header: "Trạng thái NV",
        width: 18,
        options: Object.values(employeeStatusMap),
      },
      { field: "trialDate", header: "Ngày thử việc", width: 16 },
      { field: "officialDate", header: "Ngày chính thức", width: 16 },
    ],
  },
  {
    name: "NGÂN HÀNG",
    columns: [
      { field: "bankName", header: "Ngân hàng", width: 22 },
      { field: "bankAccount", header: "Số tài khoản", width: 20 },
    ],
  },
  {
    name: "BẢO HIỂM",
    columns: [
      { field: "insuranceNumber", header: "Số sổ BHXH", width: 18 },
      { field: "insuranceStartDate", header: "Ngày bắt đầu", width: 16 },
      {
        field: "insuranceRate",
        header: "Tỷ lệ đóng (%)",
        width: 16,
        type: "number",
        numberFormat: "#,##0",
      },
    ],
  },
  {
    name: "GHI CHÚ",
    columns: [{ field: "note", header: "Ghi chú", width: 40 }],
  },
];

// Flattened columns (for FE display / export config)
export const EMPLOYEE_COLUMNS: ExportColumnConfig[] = EMPLOYEE_GROUPS.flatMap(
  (g) => g.columns,
);

// ============================================================
// Sub-sheet columns
// ============================================================

export const ALLOWANCE_COLUMNS: ExportColumnConfig[] = [
  {
    field: "employeeCode",
    header: "Mã nhân viên (*)",
    width: 18,
    required: true,
  },
  { field: "name", header: "Tên phụ cấp (*)", width: 30, required: true },
  {
    field: "amount",
    header: "Số tiền",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const DEDUCTION_COLUMNS: ExportColumnConfig[] = [
  {
    field: "employeeCode",
    header: "Mã nhân viên (*)",
    width: 18,
    required: true,
  },
  { field: "name", header: "Tên khấu trừ (*)", width: 30, required: true },
  {
    field: "amount",
    header: "Số tiền",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const CONTRACT_COLUMNS: ExportColumnConfig[] = [
  {
    field: "employeeCode",
    header: "Mã nhân viên (*)",
    width: 18,
    required: true,
  },
  {
    field: "contractNumber",
    header: "Số hợp đồng (*)",
    width: 22,
    required: true,
  },
  {
    field: "type",
    header: "Loại hợp đồng",
    width: 18,
    options: Object.values(contractTypeMap),
  },
  {
    field: "salary",
    header: "Lương hợp đồng",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
  { field: "startDate", header: "Ngày bắt đầu", width: 16 },
  { field: "endDate", header: "Ngày kết thúc", width: 16 },
];

// ============================================================
// Raw row types
// ============================================================

export interface RawEmployeeRow {
  code: string;
  name: string;
  gender?: string;
  dob?: string;
  maritalStatus?: string;
  taxCode?: string;
  ethnicity?: string;
  religion?: string;
  identityType?: string;
  identityCode?: string;
  issuedDate?: string;
  issuedPlace?: string;
  expiredDate?: string;
  email?: string;
  phone?: string;
  permanentAddress?: string;
  currentAddress?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;
  orgName?: string;
  jobPositionName?: string;
  baseSalary?: number;
  workingStatus?: string;
  employeeStatus?: string;
  trialDate?: string;
  officialDate?: string;
  bankName?: string;
  bankAccount?: string;
  insuranceNumber?: string;
  insuranceStartDate?: string;
  insuranceRate?: number;
  note?: string;
}

export interface RawAllowanceRow {
  employeeCode: string;
  name: string;
  amount?: number;
  note?: string;
}

export interface RawDeductionRow {
  employeeCode: string;
  name: string;
  amount?: number;
  note?: string;
}

export interface RawContractRow {
  employeeCode: string;
  contractNumber: string;
  type?: string;
  salary?: number;
  startDate?: string;
  endDate?: string;
}
