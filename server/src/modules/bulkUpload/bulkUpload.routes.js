import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { getSchema, downloadTemplate, importFile } from './bulkUpload.controller.js';

// Spreadsheets are parsed in memory — nothing is persisted to disk, so a failed
// or malicious upload leaves no artefacts behind.
const MAX_MB = Math.max(env.upload.maxMb, 10);
const ALLOWED_EXTENSIONS = ['.csv', '.tsv', '.txt', '.xlsx', '.xlsm', '.xls'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(ApiError.badRequest(`"${file.originalname}" is not a spreadsheet. Upload a .xlsx or .csv file.`));
    }
    return cb(null, true);
  },
});

// Translate multer's own errors into the API's error envelope.
const uploadSingle = (req, res, next) =>
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof ApiError) return next(err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest(`The file is too large. Maximum size is ${MAX_MB} MB.`));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(ApiError.badRequest('Send the spreadsheet in a form field named "file".'));
    }
    return next(ApiError.badRequest(err.message || 'The uploaded file could not be read.'));
  });

const router = Router();

router.use(requireAuth);

// Viewing the column reference only needs catalog read access…
router.get('/schema', requirePermission('categories.view'), getSchema);
router.get('/template', requirePermission('categories.view'), downloadTemplate);

// …writing the catalog needs the manage grant (products also checked in the
// controller, since a products file creates product records too).
router.post('/import', requirePermission('categories.manage'), uploadSingle, importFile);

export default router;
