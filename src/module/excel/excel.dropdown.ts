import ExcelJS from "exceljs";
import { ExportColumnConfig } from "./excel.types";

function colName(index: number): string {
  let name = "";
  let n = index;
  while (n >= 0) {
    name = String.fromCharCode((n % 26) + 65) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
}

export function applyColumnFormats(
  worksheet: ExcelJS.Worksheet,
  columns: ExportColumnConfig[],
  maxRows: number = 500,
  startRow: number = 2,
): void {
  columns.forEach((col, colIndex) => {
    const letter = colName(colIndex);

    if (col.numberFormat) {
      for (let r = startRow; r <= maxRows; r++) {
        worksheet.getCell(`${letter}${r}`).numFmt = col.numberFormat;
      }
    }

    if (col.options && col.options.length > 0) {
      const formula = `"${col.options.join(",")}"`;
      (worksheet as any).dataValidations.add(
        `${letter}${startRow}:${letter}${maxRows}`,
        {
          type: "list",
          allowBlank: true,
          formulae: [formula],
          showErrorMessage: true,
          errorTitle: "Giá trị không hợp lệ",
          error: `Vui lòng chọn một trong các giá trị: ${col.options.join(", ")}`,
        },
      );
    }
  });
}
