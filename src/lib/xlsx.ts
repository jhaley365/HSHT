import ExcelJS from "exceljs";

export type XlsxColumn = { header: string; key: string; width?: number };

// Shared XLSX builder for the Reports feature — one sheet, bold header row,
// column widths from the caller. Returns a plain ArrayBuffer, a valid
// Response body. exceljs's own .d.ts declares an ambient `Buffer extends
// ArrayBuffer` that collides with @types/node's Buffer, so writeBuffer()'s
// declared Buffer return type doesn't structurally match anything useful —
// cast through the actual runtime value (a real Node Buffer, itself a
// Uint8Array, which every JS runtime accepts as a Response body).
export async function buildWorkbookBuffer(
  sheetName: string,
  columns: XlsxColumn[],
  rows: Record<string, unknown>[]
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) sheet.addRow(row);
  const result = await workbook.xlsx.writeBuffer();
  return result as unknown as ArrayBuffer;
}

export function xlsxResponseHeaders(filename: string): HeadersInit {
  return {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
}
