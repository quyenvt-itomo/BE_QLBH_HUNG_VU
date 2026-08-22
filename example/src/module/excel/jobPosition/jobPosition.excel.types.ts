import { ExportColumnConfig } from "../excel.types";

export const JOB_POSITION_COLUMNS: ExportColumnConfig[] = [
  { field: "name", header: "Tên vị trí (*)", width: 30, required: true },
  { field: "level", header: "Cấp bậc", width: 20 },
  { field: "jobTitleName", header: "Chức danh", width: 25 },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const JOB_POSITION_SHEET_NAMES = { MAIN: "Vị trí công việc" } as const;

export interface RawJobPositionRow {
  name: string;
  level?: string;
  jobTitleName?: string;
  note?: string;
}
