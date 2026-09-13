import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getOrders,
  placeOrder,
  cancelOrder,
  reorder,
  rateOrder,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWallet,
  topupWallet,
  getCoupons,
  applyCoupon,
  getSupport,
  createSupportTicket,
  replySupportTicket,
  logout,
} from './customerProfile.controller.js';

const router = Router();

// Profile endpoints
router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.put('/me', updateProfile);
router.post('/logout', logout);

// Orders endpoints
router.get('/orders', getOrders);
router.post('/orders', placeOrder);
router.post('/orders/:id/cancel', cancelOrder);
router.post('/orders/:id/reorder', reorder);
router.post('/orders/:id/rate', rateOrder);

// Addresses endpoints
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:id', updateAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);
router.patch('/addresses/:id/default', setDefaultAddress);

// Wallet endpoints
router.get('/wallet', getWallet);
router.post('/wallet/topup', topupWallet);

// Coupons endpoints
router.get('/coupons', getCoupons);
router.post('/coupons/apply', applyCoupon);

// Support tickets endpoints
router.get('/support', getSupport);
router.post('/support', createSupportTicket);
router.post('/support/:id/reply', replySupportTicket);

export default router;
