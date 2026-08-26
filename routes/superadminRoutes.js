import express from 'express';
import {
  getDashboardStats,
  getAllPermissions,
  getRolePermissions,
  getAllRolesPermissions,
  updateRolePermissions,
  getAllDocumentServices,
  getDocumentService,
  createDocumentService,
  updateDocumentService,
  deleteDocumentService,
  getAllSystemSettings,
  getSystemSetting,
  updateSystemSetting,
  bulkUpdateSystemSettings,
  getAllFeatureFlags,
  getFeatureFlag,
  toggleFeatureFlag,
  getAuditLogs,
  exportAuditLogs,
} from '../controllers/superadminController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// ============ DASHBOARD & SYSTEM HEALTH ============

/**
 * @swagger
 * /api/superadmin/dashboard:
 *   get:
 *     summary: Get superadmin dashboard statistics and system health
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved
 *       403:
 *         description: Admin role required
 */
router.get('/dashboard', getDashboardStats);

// ============ PERMISSIONS MANAGEMENT ============

/**
 * @swagger
 * /api/superadmin/permissions:
 *   get:
 *     summary: Get all available permissions
 *     tags: [Superadmin - Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved
 */
router.get('/permissions', getAllPermissions);

/**
 * @swagger
 * /api/superadmin/permissions/matrix:
 *   get:
 *     summary: Get permission matrix for all roles
 *     tags: [Superadmin - Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permission matrix retrieved
 */
router.get('/permissions/matrix', getAllRolesPermissions);

/**
 * @swagger
 * /api/superadmin/permissions/{role}:
 *   get:
 *     summary: Get permissions for a specific role
 *     tags: [Superadmin - Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [captain, secretary, staff]
 *     responses:
 *       200:
 *         description: Role permissions retrieved
 */
router.get('/permissions/:role', getRolePermissions);

/**
 * @swagger
 * /api/superadmin/permissions/{role}:
 *   put:
 *     summary: Update permissions for a specific role
 *     tags: [Superadmin - Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [captain, secretary, staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     permissionKey:
 *                       type: string
 *                     granted:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 */
router.put('/permissions/:role', updateRolePermissions);

// ============ DOCUMENT SERVICES MANAGEMENT ============

/**
 * @swagger
 * /api/superadmin/document-services:
 *   get:
 *     summary: Get all document services
 *     tags: [Superadmin - Document Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document services retrieved
 */
router.get('/document-services', getAllDocumentServices);

/**
 * @swagger
 * /api/superadmin/document-services/{id}:
 *   get:
 *     summary: Get a single document service
 *     tags: [Superadmin - Document Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document service retrieved
 *       404:
 *         description: Document service not found
 */
router.get('/document-services/:id', getDocumentService);

/**
 * @swagger
 * /api/superadmin/document-services:
 *   post:
 *     summary: Create a new document service
 *     tags: [Superadmin - Document Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               processingFee:
 *                 type: number
 *               isFree:
 *                 type: boolean
 *               processingDays:
 *                 type: integer
 *               isAvailable:
 *                 type: boolean
 *               allowOnlineRequest:
 *                 type: boolean
 *               requiresVerification:
 *                 type: boolean
 *               requiresApproval:
 *                 type: boolean
 *               priority:
 *                 type: integer
 *               maxRequests:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document service created
 */
router.post('/document-services', createDocumentService);

/**
 * @swagger
 * /api/superadmin/document-services/{id}:
 *   put:
 *     summary: Update a document service
 *     tags: [Superadmin - Document Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Document service updated
 */
router.put('/document-services/:id', updateDocumentService);

/**
 * @swagger
 * /api/superadmin/document-services/{id}:
 *   delete:
 *     summary: Deactivate a document service (soft delete)
 *     tags: [Superadmin - Document Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document service deactivated
 */
router.delete('/document-services/:id', deleteDocumentService);

// ============ SYSTEM SETTINGS MANAGEMENT ============

/**
 * @swagger
 * /api/superadmin/settings:
 *   get:
 *     summary: Get all system settings
 *     tags: [Superadmin - System Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [barangay, request, security, notification, resident]
 *     responses:
 *       200:
 *         description: System settings retrieved
 */
router.get('/settings', getAllSystemSettings);

/**
 * @swagger
 * /api/superadmin/settings/{key}:
 *   get:
 *     summary: Get a single system setting
 *     tags: [Superadmin - System Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System setting retrieved
 *       404:
 *         description: Setting not found
 */
router.get('/settings/:key', getSystemSetting);

/**
 * @swagger
 * /api/superadmin/settings/{key}:
 *   put:
 *     summary: Update a system setting
 *     tags: [Superadmin - System Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: System setting updated
 */
router.put('/settings/:key', updateSystemSetting);

/**
 * @swagger
 * /api/superadmin/settings/bulk:
 *   put:
 *     summary: Bulk update system settings
 *     tags: [Superadmin - System Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *     responses:
 *       200:
 *         description: System settings updated
 */
router.put('/settings-bulk', bulkUpdateSystemSettings);

// ============ FEATURE FLAGS MANAGEMENT ============

/**
 * @swagger
 * /api/superadmin/feature-flags:
 *   get:
 *     summary: Get all feature flags
 *     tags: [Superadmin - Feature Flags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature flags retrieved
 */
router.get('/feature-flags', getAllFeatureFlags);

/**
 * @swagger
 * /api/superadmin/feature-flags/{key}:
 *   get:
 *     summary: Get a single feature flag
 *     tags: [Superadmin - Feature Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature flag retrieved
 *       404:
 *         description: Feature flag not found
 */
router.get('/feature-flags/:key', getFeatureFlag);

/**
 * @swagger
 * /api/superadmin/feature-flags/{key}/toggle:
 *   patch:
 *     summary: Toggle a feature flag
 *     tags: [Superadmin - Feature Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isEnabled
 *             properties:
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feature flag toggled
 */
router.patch('/feature-flags/:key/toggle', toggleFeatureFlag);

// ============ AUDIT LOGS ============

/**
 * @swagger
 * /api/superadmin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Superadmin - Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @swagger
 * /api/superadmin/audit-logs/export:
 *   get:
 *     summary: Export audit logs
 *     tags: [Superadmin - Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Audit logs exported
 */
router.get('/audit-logs/export', exportAuditLogs);

export default router;
