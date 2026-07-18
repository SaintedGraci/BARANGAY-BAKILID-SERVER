import express from 'express';
import sequelize from '../config/db.js';
import APIResponse from '../utils/apiResponse.js';

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     service:
 *                       type: string
 *                       example: Barangay Bakilid API
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                     environment:
 *                       type: string
 *                       example: development
 *                     uptime:
 *                       type: number
 *                       example: 12345.67
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                         type:
 *                           type: string
 *                           example: MySQL
 *       503:
 *         description: Service unavailable
 */
router.get('/', async (req, res) => {
    try {
        // Check database connection
        await sequelize.authenticate();
        
        const healthData = {
            status: 'healthy',
            service: 'Barangay Bakilid API',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: 'connected',
                type: 'MySQL',
                database: process.env.DB_NAME
            },
            features: {
                authentication: 'JWT with refresh tokens',
                realtime: 'Socket.IO',
                fileUpload: 'Multer',
                rateLimit: 'express-rate-limit'
            }
        };

        return APIResponse.success(res, healthData, 'API is healthy');
    } catch (error) {
        // Database connection failed
        const healthData = {
            status: 'unhealthy',
            service: 'Barangay Bakilid API',
            timestamp: new Date().toISOString(),
            database: {
                status: 'disconnected',
                error: error.message
            }
        };

        return res.status(503).json({
            success: false,
            message: 'Service unavailable',
            data: healthData,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
