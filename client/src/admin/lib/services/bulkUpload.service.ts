import { api, apiDownload, apiUpload, saveBlob } from '../api';

/* ------------------------------- Types -------------------------------- */

export type BulkUploadType = 'catalog' | 'products';
export type TemplateFormat = 'xlsx' | 'csv';

export interface BulkColumn {
  key: string;
  header: string;
  templateHeader: string;
  required: boolean;
  type: 'text' | 'url' | 'int' | 'number' | 'bool' | 'list';
  hint: string;
  example: string;
}

export interface BulkTypeSchema {
  type: BulkUploadType;
  label: string;
  description: string;
  sheet: string;
  columns: BulkColumn[];
}

export interface BulkSchema {
  maxRows: number;
  types: BulkTypeSchema[];
}

export interface BulkIssue {
  row: number;
  column: string;
  message: string;
}

export interface BulkCount {
  created: number;
  updated: number;
}

export interface BulkResult {
  dryRun: boolean;
  type: BulkUploadType;
  file: string;
  updateExisting: boolean;
  rows: { total: number; imported: number; failed: number };
  counts: {
    categories: BulkCount;
    subcategories: BulkCount;
    brands: BulkCount;
    products: BulkCount;
    variants: BulkCount;
  };
  errors: BulkIssue[];
  warnings: BulkIssue[];
  unknownHeaders: string[];
  recognisedColumns: string[];
}

/* ------------------------------ Queries ------------------------------- */

/** Column reference straight from the server, so the UI guide never drifts. */
export function getBulkSchema(): Promise<BulkSchema> {
  return api.get<BulkSchema>('/bulk-upload/schema');
}

/* ----------------------------- Downloads ------------------------------ */

export async function downloadTemplate(
  type: BulkUploadType,
  format: TemplateFormat,
  withSample = true
): Promise<void> {
  const { blob, filename } = await apiDownload('/bulk-upload/template', {
    type,
    format,
    sample: withSample,
  });
  saveBlob(blob, filename ?? `${type}-bulk-upload-template.${format}`);
}

/* ------------------------------ Import -------------------------------- */

export function importBulkFile(
  file: File,
  options: { type: BulkUploadType; dryRun?: boolean; updateExisting?: boolean }
): Promise<BulkResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('type', options.type);
  form.append('dryRun', String(options.dryRun ?? false));
  form.append('updateExisting', String(options.updateExisting ?? true));
  return apiUpload<BulkResult>('/bulk-upload/import', form);
}

/* --------------------------- Error report ----------------------------- */

const csvEscape = (value: unknown) => {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/** Downloadable report of every rejected row, so the source file can be fixed. */
export function downloadIssueReport(result: BulkResult): void {
  const rows = [
    ...result.errors.map((issue) => ['Error', issue.row, issue.column, issue.message]),
    ...result.warnings.map((issue) => ['Warning', issue.row, issue.column, issue.message]),
  ].sort((a, b) => Number(a[1]) - Number(b[1]));

  const csv = [
    ['Severity', 'File Row', 'Column', 'Problem'].join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\r\n');

  const stamp = new Date().toISOString().slice(0, 10);
  saveBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), `bulk-upload-issues-${stamp}.csv`);
}
