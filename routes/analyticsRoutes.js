import express from 'express';
import {
  getDashboardKPIs,
  getRegistrationTrend,
  getDocumentRequestAnalytics,
  getRequestStatusDistribution,
  getComplaintAnalytics,
  getResidentDemographics,
  getMonthlyActivity,
  getVerificationProgress,
  getQuickStatistics
} from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All analytics routes require authentication and admin/captain/secretary roles
router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'captain', 'secretary']));

router.get('/kpis', getDashboardKPIs);
router.get('/registration-trend', getRegistrationTrend);
router.get('/document-requests', getDocumentRequestAnalytics);
router.get('/request-status', getRequestStatusDistribution);
router.get('/complaints', getComplaintAnalytics);
router.get('/demographics', getResidentDemographics);
router.get('/monthly-activity', getMonthlyActivity);
router.get('/verification-progress', getVerificationProgress);
router.get('/quick-stats', getQuickStatistics);

export default router;
