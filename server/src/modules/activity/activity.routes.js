import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { listActivity, activityStats, activityFilters } from './activity.controller.js';

const router = Router();
router.use(requireAuth);

// The audit trail is read-only by design — no create/update/delete endpoints.
const view = requirePermission('activity.view');

router.get('/', view, listActivity);
router.get('/stats', view, activityStats);
router.get('/filters', view, activityFilters);

export default router;
