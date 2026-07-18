import express from 'express';
import { getLogFiles, getLogContent, getLogStats, clearLogs } from '../controllers/logsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All log routes require admin authentication
router.use(authMiddleware, requireAdmin);

/**
 * @swagger
 * /api/logs/files:
 *   get:
 *     summary: Get list of log files
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log files retrieved
 *       403:
 *         description: Admin role required
 */
router.get('/files', getLogFiles);

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: Get log statistics
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved
 *       403:
 *         description: Admin role required
 */
router.get('/stats', getLogStats);

/**
 * @swagger
 * /api/logs/{filename}:
 *   get:
 *     summary: Get log file content
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Log content retrieved
 *       403:
 *         description: Admin role required
 */
router.get('/:filename', getLogContent);

/**
 * @swagger
 * /api/logs/{filename}:
 *   delete:
 *     summary: Clear/archive log file
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Log file cleared
 *       403:
 *         description: Admin role required
 */
router.delete('/:filename', clearLogs);

export default router;
