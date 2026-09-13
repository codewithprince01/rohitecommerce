import { Router } from 'express';
import { z } from 'zod';
import { Customer } from '../../models/Customer.js';
import { crudController } from '../../utils/crudController.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listCustomers,
  customerStats,
  getCustomerDetail,
  bulkBlock,
  bulkDelete,
  normalizeCustomer,
} from './customers.controller.js';

// create/update/remove reuse the generic CRUD handlers, with blank
// email/phone normalized to null before write.
const c = crudController(Customer, {
  entity: 'customer',
  transformWrite: (body) => normalizeCustomer(body),
});

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().nullish().or(z.literal('')),
  phone: z.string().nullish(),
  is_blocked: z.boolean().optional(),
  notes: z.string().nullish(),
});

const idsSchema = z.object({ ids: z.array(z.string()).min(1) });

const router = Router();
router.use(requireAuth);

// Static routes before the `/:id` param route.
router.get('/', requirePermission('customers.view'), listCustomers);
router.get('/stats', requirePermission('customers.view'), customerStats);
router.post('/bulk/block', requirePermission('customers.manage'),
  validate(idsSchema.extend({ is_blocked: z.boolean() })), bulkBlock);
router.post('/bulk/delete', requirePermission('customers.manage'),
  validate(idsSchema), bulkDelete);

router.get('/:id', requirePermission('customers.view'), getCustomerDetail);
router.post('/', requirePermission('customers.manage'), validate(customerSchema), c.create);
router.patch('/:id', requirePermission('customers.manage'), validate(customerSchema.partial()), c.update);
router.delete('/:id', requirePermission('customers.manage'), c.remove);

export default router;
