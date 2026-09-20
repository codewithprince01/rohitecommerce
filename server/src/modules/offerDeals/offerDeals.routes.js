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
router.get('/', listOfferDeals);
router.post('/', createOfferDeal);
router.patch('/:id', updateOfferDeal);
router.put('/:id', updateOfferDeal);
router.delete('/:id', deleteOfferDeal);

export default router;
