import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import {
  getPublicHomeSections,
  listHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  reorderHomeSections,
} from './homeSections.controller.js';

const router = Router();

// Public route for storefront
router.get('/public', getPublicHomeSections);

// Admin routes
router.use(requireAuth);
router.get('/', requirePermission('homeSections.view'), listHomeSections);
router.post('/', requirePermission('homeSections.manage'), createHomeSection);
router.post('/reorder', requirePermission('homeSections.manage'), reorderHomeSections);
router.patch('/:id', requirePermission('homeSections.manage'), updateHomeSection);
router.put('/:id', requirePermission('homeSections.manage'), updateHomeSection);
router.delete('/:id', requirePermission('homeSections.manage'), deleteHomeSection);

export default router;
