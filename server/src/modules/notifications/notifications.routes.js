import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listNotifications, notificationStats, unreadCount, markRead, markAllRead,
  bulkAction, deleteNotification, clearRead,
} from './notifications.controller.js';

const router = Router();
router.use(requireAuth);

// There is no `notifications.manage` permission in the matrix — anyone who can
// view the feed may mark/clear their own notifications.
const view = requirePermission('notifications.view');

// Static routes before the `/:id` param route.
router.get('/', view, listNotifications);
router.get('/stats', view, notificationStats);
router.get('/unread-count', view, unreadCount);
router.post('/read-all', view, markAllRead);
router.post('/clear-read', view, clearRead);
router.post('/bulk', view,
  validate(z.object({ ids: z.array(z.string()).min(1), action: z.enum(['read', 'unread', 'delete']) })),
  bulkAction);

router.patch('/:id/read', view, validate(z.object({ is_read: z.boolean().optional() })), markRead);
router.delete('/:id', view, deleteNotification);

export default router;
