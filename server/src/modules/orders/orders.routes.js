import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listOrders, orderStats, getOrder, getOrderHistory, createOrder,
  updateStatus, bulkUpdateStatus, updatePayment, deleteOrder,
} from './orders.controller.js';

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

const itemSchema = z.object({
  product_id: z.string().nullish(),
  variant_id: z.string().nullish(),
  product_name: z.string().min(1),
  variant_label: z.string().nullish(),
  unit_price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  line_total: z.number().nonnegative(),
});

const createSchema = z.object({
  customer_id: z.string().nullish(),
  payment_method: z.enum(['cod', 'card', 'upi', 'wallet']).optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  delivery_fee: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  notes: z.string().nullish(),
  delivery_address: z.record(z.any()).nullish(),
  items: z.array(itemSchema).min(1, 'An order needs at least one item'),
});

const router = Router();
router.use(requireAuth);

// Static routes must precede the `/:id` param route.
router.get('/', requirePermission('orders.view'), listOrders);
router.get('/stats', requirePermission('orders.view'), orderStats);
router.post('/bulk/status', requirePermission('orders.update'),
  validate(z.object({
    ids: z.array(z.string()).min(1),
    status: z.enum(ORDER_STATUSES),
    note: z.string().nullish(),
  })), bulkUpdateStatus);
router.get('/:id', requirePermission('orders.view'), getOrder);
router.get('/:id/history', requirePermission('orders.view'), getOrderHistory);
router.post('/', requirePermission('orders.update'), validate(createSchema), createOrder);
router.patch('/:id/status', requirePermission('orders.update'),
  validate(z.object({ status: z.enum(ORDER_STATUSES), note: z.string().nullish() })), updateStatus);
router.patch('/:id/payment', requirePermission('orders.update'),
  validate(z.object({ payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']) })), updatePayment);
router.delete('/:id', requirePermission('orders.delete'), deleteOrder);

export default router;
