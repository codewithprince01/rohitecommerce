import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { can } from '../../config/permissions.js';
import { logActivity } from '../../services/activity.service.js';
import { TEMPLATES, TEMPLATE_TYPES, templateColumns } from './bulkUpload.schema.js';
import { buildCsvTemplate, buildXlsxTemplate, CONTENT_TYPES } from './bulkUpload.templates.js';
import { parseUpload } from './bulkUpload.parser.js';
import { mapRows, importRows, MAX_ROWS } from './bulkUpload.import.js';

const FORMATS = ['csv', 'xlsx'];

function assertType(type) {
  if (!TEMPLATE_TYPES.includes(type)) {
    throw ApiError.badRequest(`Unknown upload type "${type}". Expected one of: ${TEMPLATE_TYPES.join(', ')}`);
  }
  return type;
}

/**
 * Column reference for the admin UI — served from the same definition that
 * generates the templates and drives the parser, so the on-screen guide can
 * never drift from what the importer actually accepts.
 */
export const getSchema = asyncHandler(async (_req, res) =>
  ok(res, {
    maxRows: MAX_ROWS,
    types: TEMPLATE_TYPES.map((type) => ({
      type,
      label: TEMPLATES[type].label,
      description: TEMPLATES[type].description,
      sheet: TEMPLATES[type].sheet,
      columns: templateColumns(type).map(({ key, header, templateHeader, required, type: fieldType, hint, example }) => ({
        key,
        header,
        templateHeader,
        required,
        type: fieldType,
        hint,
        example: String(example ?? ''),
      })),
    })),
  })
);

/** Stream a blank (or sample-filled) template in the requested format. */
export const downloadTemplate = asyncHandler(async (req, res) => {
  const type = assertType(String(req.query.type || 'products'));
  const format = String(req.query.format || 'xlsx').toLowerCase();
  if (!FORMATS.includes(format)) {
    throw ApiError.badRequest(`Unknown format "${format}". Expected one of: ${FORMATS.join(', ')}`);
  }
  // Samples are on by default: an empty sheet gives no hint about the expected shape.
  const sample = String(req.query.sample ?? 'true') !== 'false';

  const buffer = format === 'csv' ? buildCsvTemplate(type, { sample }) : await buildXlsxTemplate(type, { sample });
  const filename = `${TEMPLATES[type].fileBase}.${format}`;

  res.setHeader('Content-Type', CONTENT_TYPES[format]);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(buffer);
});

/**
 * Parse an uploaded CSV/XLSX and either report what it would do (`dryRun`)
 * or write it to the catalog. Bad rows are reported, never fatal.
 */
export const importFile = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer?.length) {
    throw ApiError.badRequest('No file was uploaded. Choose a .xlsx or .csv file and try again.');
  }

  const type = assertType(String(req.body.type || 'products'));
  const dryRun = String(req.body.dryRun ?? 'false') === 'true';
  const updateExisting = String(req.body.updateExisting ?? 'true') !== 'false';

  // Products import also touches product records, so it needs the stronger grant.
  if (type === 'products' && !can(req.admin.role, 'products.create')) {
    throw ApiError.forbidden('Missing permission: products.create');
  }

  const parsed = await parseUpload(req.file.buffer, req.file.originalname);
  const mapped = mapRows(type, parsed);

  const {
    counts,
    errors: importErrors,
    imported,
    failedRows: importFailed,
    errorsTruncated: importTruncated,
  } = await importRows(type, mapped.rows, { dryRun, updateExisting });

  const errors = [...mapped.errors, ...importErrors].sort((a, b) => a.row - b.row);
  // Counted while running, not derived from `errors`: message collection stops
  // at a cap, so a 2,500-row file would otherwise report far fewer failures
  // than it really had and leave rows unaccounted for.
  const failedRows = mapped.failedRows + importFailed;
  const errorsTruncated = mapped.errorsTruncated || importTruncated;

  if (!dryRun && imported > 0) {
    await logActivity(req, 'bulk_import', type === 'products' ? 'product' : 'category', null, {
      file: req.file.originalname,
      type,
      updateExisting,
      rows: { total: mapped.totalRows, imported, failed: failedRows },
      counts,
    });
  }

  return ok(res, {
    dryRun,
    type,
    file: req.file.originalname,
    updateExisting,
    rows: { total: mapped.totalRows, imported, failed: failedRows, carried: mapped.carriedRows },
    counts,
    errors,
    errorsTruncated,
    warnings: mapped.warnings,
    unknownHeaders: mapped.unknownHeaders,
    recognisedColumns: mapped.recognisedColumns,
  });
});
