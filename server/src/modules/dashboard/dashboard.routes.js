import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { getDashboard } from './dashboard.controller.js';

const router = Router();
router.get('/', requireAuth, requirePermission('dashboard.view'), getDashboard);
export default router;
