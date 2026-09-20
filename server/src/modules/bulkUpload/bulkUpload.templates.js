/**
 * Downloadable CSV / XLSX templates generated straight from the column
 * contract, so the file an admin fills in always matches what the importer
 * expects. The workbook also ships an Instructions sheet documenting every
 * column, which keeps support questions off the "what goes in column K" path.
 */

import ExcelJS from 'exceljs';
import { TEMPLATES, templateColumns, SAMPLE_ROWS } from './bulkUpload.schema.js';

const BOM = '﻿';

/** Quote a CSV field only when it needs it. */
function csvEscape(value) {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function buildCsvTemplate(type, { sample = true } = {}) {
  const columns = templateColumns(type);
  const lines = [columns.map((c) => csvEscape(c.templateHeader)).join(',')];

  if (sample) {
    for (const row of SAMPLE_ROWS[type] ?? []) {
      lines.push(columns.map((c) => csvEscape(row[c.key] ?? '')).join(','));
    }
  }

  // The BOM makes Excel open the UTF-8 file with the right encoding.
  return Buffer.from(BOM + lines.join('\r\n') + '\r\n', 'utf8');
}

/* --------------------------------- XLSX ---------------------------------- */

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
const REQUIRED_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
const TITLE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

/** Rough column width from the header plus the widest example value. */
function widthFor(column) {
  const longest = Math.max(column.templateHeader.length, String(column.example ?? '').length);
  return Math.min(46, Math.max(14, longest + 4));
}

export async function buildXlsxTemplate(type, { sample = true } = {}) {
  const template = TEMPLATES[type];
  const columns = templateColumns(type);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FreshMart Admin';
  workbook.created = new Date();

  /* ---- Data sheet ---- */
  const sheet = workbook.addWorksheet(template.sheet, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = columns.map((c) => ({ key: c.key, width: widthFor(c) }));

  const headerRow = sheet.addRow(columns.map((c) => c.templateHeader));
  headerRow.height = 30;
  headerRow.eachCell((cell, index) => {
    const column = columns[index - 1];
    cell.fill = column.required ? REQUIRED_FILL : HEADER_FILL;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF0F5132' } } };
    // Hover note so the hint is available without leaving the sheet.
    cell.note = `${column.required ? 'REQUIRED\n' : 'Optional\n'}${column.hint}\n\nExample: ${column.example}`;
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  if (sample) {
    for (const row of SAMPLE_ROWS[type] ?? []) {
      const added = sheet.addRow(columns.map((c) => row[c.key] ?? ''));
      added.alignment = { vertical: 'middle' };
    }
  }

  // Dropdowns + number formats for the first 500 data rows so typos are caught
  // while typing rather than at import time.
  const lastRow = 501;
  columns.forEach((column, index) => {
    const letterColumn = sheet.getColumn(index + 1);
    if (column.type === 'bool') {
      for (let row = 2; row <= lastRow; row += 1) {
        sheet.getCell(row, index + 1).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"TRUE,FALSE"'],
          showErrorMessage: true,
          errorStyle: 'warning',
          errorTitle: 'Use TRUE or FALSE',
          error: 'Allowed values: TRUE, FALSE (yes/no and 1/0 also import correctly).',
        };
      }
    }
    if (column.type === 'number') letterColumn.numFmt = '0.00';
    if (column.type === 'int') letterColumn.numFmt = '0';
  });

  /* ---- Instructions sheet ---- */
  const guide = workbook.addWorksheet('Instructions', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });
  guide.columns = [
    { width: 34 },
    { width: 12 },
    { width: 12 },
    { width: 66 },
    { width: 34 },
  ];

  const title = guide.addRow([`${template.label} — bulk upload template`]);
  title.font = { bold: true, size: 14, color: { argb: 'FF0F5132' } };
  guide.mergeCells(1, 1, 1, 5);
  title.height = 24;

  const intro = guide.addRow([template.description]);
  guide.mergeCells(2, 1, 2, 5);
  intro.alignment = { wrapText: true, vertical: 'middle' };
  intro.height = 34;

  const rules = [
    `Fill your data in the "${template.sheet}" sheet. Delete the sample rows before uploading.`,
    'Columns marked * are required. Column order can be changed and extra columns are ignored.',
    'Existing records are matched by slug and reused — the same file can be re-uploaded safely.',
    type === 'products'
      ? 'Repeat the product on multiple rows to add multiple pack sizes (each row = one pack).'
      : 'Leave subcategory / sub-sub category blank to create only the category.',
    'Images are links: paste a full https://… URL or an /uploads/… path from your server.',
    'Run "Validate file" in the admin before importing to see problems without saving anything.',
  ];
  guide.addRow([]);
  for (const rule of rules) {
    const row = guide.addRow([`•  ${rule}`]);
    guide.mergeCells(row.number, 1, row.number, 5);
    row.alignment = { wrapText: true, vertical: 'middle' };
  }
  guide.addRow([]);

  const guideHeader = guide.addRow(['Column', 'Required', 'Type', 'What to fill', 'Example']);
  guideHeader.eachCell((cell) => {
    cell.fill = TITLE_FILL;
    cell.font = { bold: true, color: { argb: 'FF0F172A' } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });

  for (const column of columns) {
    const row = guide.addRow([
      column.templateHeader,
      column.required ? 'Yes' : 'No',
      column.type,
      column.hint,
      String(column.example ?? ''),
    ]);
    row.alignment = { wrapText: true, vertical: 'top' };
    if (column.required) row.getCell(2).font = { bold: true, color: { argb: 'FFB91C1C' } };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export const CONTENT_TYPES = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
