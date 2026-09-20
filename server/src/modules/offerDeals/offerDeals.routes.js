import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import {
  getPublicOfferDeals,
  listOfferDeals,
  createOfferDeal,
  updateOfferDeal,
  deleteOfferDeal,
} from './offerDeals.controller.js';

const router = Router();

// Public route for storefront
router.get('/public', getPublicOfferDeals);

// Admin routes
router.use(requireAuth);
router.get('/', requirePermission('offers.view'), listOfferDeals);
router.post('/', requirePermission('offers.manage'), createOfferDeal);
router.patch('/:id', requirePermission('offers.manage'), updateOfferDeal);
router.put('/:id', requirePermission('offers.manage'), updateOfferDeal);
router.delete('/:id', requirePermission('offers.manage'), deleteOfferDeal);

export default router;
