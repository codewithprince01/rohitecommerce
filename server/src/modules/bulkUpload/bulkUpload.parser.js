/**
 * Tabular file readers for the bulk uploader.
 *
 * Both readers return the same shape — `{ headers, records }` where a record
 * carries the spreadsheet row number — so error messages can point the admin at
 * the exact line in the file they uploaded.
 */

import ExcelJS from 'exceljs';
import { ApiError } from '../../utils/ApiError.js';

/* --------------------------------- CSV ---------------------------------- */

/** Pick the delimiter by counting candidates outside quoted sections. */
function detectDelimiter(text) {
  const candidates = [',', ';', '\t', '|'];
  const firstLine = (() => {
    let inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (!inQuotes && (ch === '\n' || ch === '\r')) return text.slice(0, i);
    }
    return text;
  })();

  let best = ',';
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

/**
 * RFC-4180 style CSV reader: handles quoted fields, escaped `""`, embedded
 * commas/newlines, CRLF endings and a leading BOM.
 */
export function parseCsv(text) {
  const clean = String(text).replace(/^﻿/, '');
  const delimiter = detectDelimiter(clean);

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];

    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') inQuotes = true;
    else if (ch === delimiter) endField();
    else if (ch === '\r') {
      if (clean[i + 1] === '\n') i += 1;
      endRow();
    } else if (ch === '\n') endRow();
    else field += ch;
  }
  // Trailing field/row (file not ending in a newline).
  if (field.length > 0 || row.length > 0) endRow();

  return toRecords(rows.map((cells) => cells.map((c) => c.trim())));
}

/* --------------------------------- XLSX --------------------------------- */

/** Flatten any ExcelJS cell value (rich text, formula, hyperlink, date) to text. */
function cellToText(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text ?? '').join('');
    if ('result' in value) return cellToText(value.result);
    if ('text' in value) return cellToText(value.text);
    if ('hyperlink' in value) return String(value.hyperlink);
    if ('error' in value) return '';
    return '';
  }
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}

export async function parseXlsx(buffer) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw ApiError.badRequest(
      'This Excel file could not be read. Open it in Excel and use "Save As → Excel Workbook (.xlsx)", then upload again.'
    );
  }

  // Skip the read-me tab that ships with our own templates.
  const sheets = workbook.worksheets.filter((ws) => ws.rowCount > 0);
  if (!sheets.length) throw ApiError.badRequest('The uploaded workbook has no sheets with data.');
  const sheet = sheets.find((ws) => !/instruction|guide|readme|help/i.test(ws.name)) ?? sheets[0];

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells = [];
    // `row.cellCount` covers trailing blanks inside the used range.
    for (let col = 1; col <= Math.max(row.cellCount, row.actualCellCount); col += 1) {
      cells[col - 1] = cellToText(row.getCell(col).value).trim();
    }
    rows[rowNumber - 1] = cells;
  });

  // eachRow skips blank rows, leaving holes — normalize them to empty arrays.
  for (let i = 0; i < rows.length; i += 1) if (!rows[i]) rows[i] = [];

  return toRecords(rows);
}

/* ------------------------------- Shared ---------------------------------- */

const isBlankRow = (cells) => cells.every((c) => c === undefined || c === null || String(c).trim() === '');

/**
 * Turn a raw grid into `{ headers, records }`: the first non-empty row is the
 * header, every later non-empty row becomes a record tagged with its 1-based
 * spreadsheet row number.
 */
function toRecords(grid) {
  const headerIndex = grid.findIndex((cells) => cells && !isBlankRow(cells));
  if (headerIndex === -1) {
    throw ApiError.badRequest('The uploaded file is empty — no header row was found.');
  }

  const headers = grid[headerIndex].map((h) => String(h ?? '').trim());
  const records = [];

  for (let i = headerIndex + 1; i < grid.length; i += 1) {
    const cells = grid[i] ?? [];
    if (isBlankRow(cells)) continue; // ignore spacer rows anywhere in the sheet
    records.push({ rowNumber: i + 1, cells });
  }

  return { headers, records, headerRowNumber: headerIndex + 1 };
}

/** Read an uploaded buffer based on its filename extension. */
export async function parseUpload(buffer, filename = '') {
  const ext = String(filename).toLowerCase().split('.').pop();

  if (ext === 'xlsx' || ext === 'xlsm') return parseXlsx(buffer);
  if (ext === 'xls') {
    throw ApiError.badRequest(
      'The old .xls format is not supported. Open the file in Excel and save it as .xlsx (or .csv), then upload again.'
    );
  }
  if (ext === 'csv' || ext === 'txt' || ext === 'tsv') return parseCsv(buffer.toString('utf8'));

  // No/unknown extension: sniff the ZIP magic bytes an .xlsx always starts with.
  if (buffer.length > 1 && buffer[0] === 0x50 && buffer[1] === 0x4b) return parseXlsx(buffer);
  return parseCsv(buffer.toString('utf8'));
}
