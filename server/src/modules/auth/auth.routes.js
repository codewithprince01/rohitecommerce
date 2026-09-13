import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rateLimit.middleware.js';
import { loginSchema, refreshSchema, changePasswordSchema } from './auth.validators.js';
import { login, me, refresh, logout, changePassword } from './auth.controller.js';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, validate(refreshSchema), refresh);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);
router.post('/change-password', requireAuth, validate(changePasswordSchema), changePassword);

export default router;
