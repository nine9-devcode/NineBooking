// ไฟล์: lib/excel.ts
// Excel Generation Utility using ExcelJS

import ExcelJS from 'exceljs';

import { excelTheme } from '@/config/pdf-theme';

// สีเอกสาร Excel — ค่ากลางอยู่ที่ config/pdf-theme (ExcelJS ใช้รูปแบบ ARGB)
const BRAND_COLOR = excelTheme.primary;
const BORDER_COLOR = excelTheme.border;

// Status colors
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'fef3c7',    // Yellow bg
  CONFIRMED: 'dbeafe',  // Blue bg
  COMPLETED: 'dcfce7',  // Green bg
  CANCELLED: 'fee2e2',  // Red bg
};

// Status text
export const STATUS_TEXT: Record<string, string> = {
  PENDING: 'รอดำเนินการ',
  CONFIRMED: 'ยืนยันแล้ว',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
};

// Format date to Thai short format
export const formatShortDate = (date: Date | string): string => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = (d.getFullYear() + 543).toString().slice(-2);
  return `${day}/${month}/${year}`;
};

// Create workbook with default settings
export const createWorkbook = (): ExcelJS.Workbook => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NineBooking';
  workbook.created = new Date();
  return workbook;
};

// Style header row
export const styleHeaderRow = (row: ExcelJS.Row): void => {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_COLOR },
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFF' },
      size: 11,
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER_COLOR } },
      bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
      left: { style: 'thin', color: { argb: BORDER_COLOR } },
      right: { style: 'thin', color: { argb: BORDER_COLOR } },
    };
  });
  row.height = 25;
};

// Style data row
export const styleDataRow = (row: ExcelJS.Row, isEven: boolean = false): void => {
  row.eachCell((cell) => {
    if (isEven) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FAFAFA' },
      };
    }
    cell.font = {
      size: 10,
    };
    cell.alignment = {
      vertical: 'middle',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'EEEEEE' } },
      bottom: { style: 'thin', color: { argb: 'EEEEEE' } },
      left: { style: 'thin', color: { argb: 'EEEEEE' } },
      right: { style: 'thin', color: { argb: 'EEEEEE' } },
    };
  });
  row.height = 22;
};

// Style status cell
export const styleStatusCell = (cell: ExcelJS.Cell, status: string): void => {
  const bgColor = STATUS_COLORS[status] || 'FFFFFF';
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: bgColor },
  };
  cell.font = {
    bold: true,
    size: 10,
  };
  cell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
};

// Add title row
export const addTitleRow = (
  worksheet: ExcelJS.Worksheet,
  title: string,
  columnCount: number
): void => {
  const titleRow = worksheet.addRow([title]);
  worksheet.mergeCells(1, 1, 1, columnCount);
  titleRow.getCell(1).font = {
    bold: true,
    size: 16,
    color: { argb: BRAND_COLOR },
  };
  titleRow.getCell(1).alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  titleRow.height = 35;
};

// Add subtitle row (e.g., export date, filter info)
export const addSubtitleRow = (
  worksheet: ExcelJS.Worksheet,
  subtitle: string,
  columnCount: number
): void => {
  const row = worksheet.addRow([subtitle]);
  worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, columnCount);
  row.getCell(1).font = {
    size: 10,
    color: { argb: '666666' },
  };
  row.getCell(1).alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  row.height = 20;
};

// Auto-fit column widths (approximate)
export const autoFitColumns = (
  worksheet: ExcelJS.Worksheet,
  minWidth: number = 10,
  maxWidth: number = 50
): void => {
  worksheet.columns.forEach((column) => {
    let maxLength = minWidth;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value?.toString() || '';
      // Thai characters need more width
      const cellLength = cellValue.length * 1.5;
      if (cellLength > maxLength) {
        maxLength = Math.min(cellLength, maxWidth);
      }
    });
    column.width = maxLength;
  });
};

// Generate Excel buffer
export const generateExcelBuffer = async (
  workbook: ExcelJS.Workbook
): Promise<Buffer> => {
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export default {
  createWorkbook,
  styleHeaderRow,
  styleDataRow,
  styleStatusCell,
  addTitleRow,
  addSubtitleRow,
  autoFitColumns,
  generateExcelBuffer,
  STATUS_TEXT,
  formatShortDate,
};
