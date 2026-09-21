import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import productRoutes from '../modules/products/products.routes.js';
import orderRoutes from '../modules/orders/orders.routes.js';
import customerRoutes from '../modules/customers/customers.routes.js';
import categoryRoutes from '../modules/categories/categories.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';
import bannerRoutes from '../modules/banners/banners.routes.js';
import homeSectionRoutes from '../modules/homeSections/homeSections.routes.js';
import offerDealRoutes from '../modules/offerDeals/offerDeals.routes.js';
import reportRoutes from '../modules/reports/reports.routes.js';
import deliveryRoutes from '../modules/delivery/delivery.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';
import notificationRoutes from '../modules/notifications/notifications.routes.js';
import adminRoutes from '../modules/admins/admins.routes.js';
import activityRoutes from '../modules/activity/activity.routes.js';
import customerProfileRoutes from '../modules/customerProfile/customerProfile.routes.js';
import bulkUploadRoutes from '../modules/bulkUpload/bulkUpload.routes.js';
import uploadRoutes from '../modules/uploads/uploads.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', ts: Date.now() }));

router.use('/customer', customerProfileRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/categories', categoryRoutes);
router.use('/bulk-upload', bulkUploadRoutes);
router.use('/uploads', uploadRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/banners', bannerRoutes);
router.use('/home-sections', homeSectionRoutes);
router.use('/offer-deals', offerDealRoutes);
router.use('/reports', reportRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admins', adminRoutes);
router.use('/activity', activityRoutes);

export default router;
