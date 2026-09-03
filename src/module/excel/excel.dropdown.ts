import ExcelJS from "exceljs";
import { ExportColumnConfig } from "./excel.types";

export function applyColumnFormats(
  sheet: ExcelJS.Worksheet,
  columns: ExportColumnConfig[],
): void {
  columns.forEach((column, index) => {
    const excelColumn = sheet.getColumn(index + 1);
    if (column.numberFormat || column.type === "date") {
      excelColumn.eachCell?.((cell) => {
        cell.numFmt = column.numberFormat || "dd/mm/yyyy";
      });
    }
    if (column.options?.length) {
      const formula = '"' + column.options.join(",") + '"';
      excelColumn.eachCell?.((cell, rowNumber) => {
        if (rowNumber > 1) {
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [formula],
          };
        }
      });
    }
  });
}

export function formatHeader(row: ExcelJS.Row): void {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
}
