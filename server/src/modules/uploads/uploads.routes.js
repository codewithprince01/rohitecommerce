import { Router } from 'express';
import { requireAuth, requireAnyPermission } from '../../middleware/auth.middleware.js';
import { uploadSingleImage } from './uploads.storage.js';
import { uploadImage, deleteImage } from './uploads.controller.js';

const router = Router();

router.use(requireAuth);

// One endpoint for every image field in the console; whoever may edit a
// product, a category or a banner may upload the picture that goes on it.
const canUpload = requireAnyPermission(
  'products.create',
  'products.update',
  'categories.manage',
  'banners.manage',
  'homeSections.manage',
  'offers.manage',
  'settings.manage'
);

router.post('/image', canUpload, uploadSingleImage, uploadImage);
router.delete('/image', canUpload, deleteImage);

export default router;
