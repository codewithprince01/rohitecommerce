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
router.get('/', listHomeSections);
router.post('/', createHomeSection);
router.post('/reorder', reorderHomeSections);
router.patch('/:id', updateHomeSection);
router.put('/:id', updateHomeSection);
router.delete('/:id', deleteHomeSection);

export default router;
