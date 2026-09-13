import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { getReport } from './reports.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', requirePermission('reports.view'), getReport);

export default router;
