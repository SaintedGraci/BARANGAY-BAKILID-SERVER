import express from 'express';
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  updateUserStatus,
  resetUserPassword
} from '../controllers/userManagementController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All user management routes require authentication and system admin role only
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/', getAllAdminUsers);
router.post('/', createAdminUser);
router.put('/:id', updateAdminUser);
router.delete('/:id', deleteAdminUser);
router.patch('/:id/status', updateUserStatus);
router.patch('/:id/reset-password', resetUserPassword);

export default router;
