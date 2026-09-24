import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import {
  listInventory,
  inventoryStats,
  inventoryAnalytics,
  adjustStock,
  bulkAdjustStock,
  variantMovements,
  exportSheet,
  importSheet,
} from './inventory.controller.js';

// The edited sheet is parsed in memory — a rejected upload leaves nothing on disk.
const SHEET_MAX_MB = Math.max(env.upload.maxMb, 10);
const SHEET_EXTENSIONS = ['.csv', '.tsv', '.txt', '.xlsx', '.xlsm', '.xls'];

const sheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: SHEET_MAX_MB * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (!SHEET_EXTENSIONS.includes(ext)) {
      return cb(ApiError.badRequest(`"${file.originalname}" is not a spreadsheet. Upload the .xlsx or .csv you exported.`));
    }
    return cb(null, true);
  },
});

const uploadSheet = (req, res, next) =>
  sheetUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof ApiError) return next(err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest(`The file is too large. Maximum size is ${SHEET_MAX_MB} MB.`));
    }
    return next(ApiError.badRequest(err.message || 'The uploaded file could not be read.'));
  });

const MOVEMENT_REASONS = ['manual', 'restock', 'sale', 'correction', 'return', 'damage', 'stocktake', 'transfer'];

// Single-SKU adjustment: either a signed delta (`change`) or an absolute `set`,
// optionally updating the SKU's reorder point in the same call.
const adjustSchema = z
  .object({
    change: z.number().optional(),
    set: z.number().int().nonnegative().optional(),
    reason: z.enum(MOVEMENT_REASONS).optional(),
    note: z.string().max(500).nullish(),
    reference: z.string().max(120).nullish(),
    low_stock_threshold: z.number().int().nonnegative().optional(),
  })
  .refine(
    (b) => b.change !== undefined || b.set !== undefined || b.low_stock_threshold !== undefined,
    { message: 'Provide a change, a set value, or a threshold update' }
  );

const bulkAdjustSchema = z.object({
  ids: z.array(z.string()).min(1),
  mode: z.enum(['add', 'remove', 'set']).optional(),
  amount: z.number().int(),
  reason: z.enum(MOVEMENT_REASONS).optional(),
  note: z.string().max(500).nullish(),
});

const router = Router();
router.use(requireAuth);

router.get('/', requirePermission('inventory.view'), listInventory);
router.get('/stats', requirePermission('inventory.view'), inventoryStats);
router.get('/analytics', requirePermission('inventory.view'), inventoryAnalytics);
// Declared before '/:id/adjust', otherwise Express matches "bulk" as a variant
// id and validates the payload against the single-SKU schema — which rejects
// every bulk stock update.
router.post('/bulk/adjust', requirePermission('inventory.adjust'), validate(bulkAdjustSchema), bulkAdjustStock);

// Sheet round-trip. Same reason as above: both sit before the '/:id' routes.
router.get('/export', requirePermission('inventory.view'), exportSheet);
router.post('/import', requirePermission('inventory.adjust'), uploadSheet, importSheet);

router.get('/:id/movements', requirePermission('inventory.view'), variantMovements);
router.post('/:id/adjust', requirePermission('inventory.adjust'), validate(adjustSchema), adjustStock);

export default router;
