import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { Sequelize } from "sequelize";
import swaggerUi from 'swagger-ui-express';
import sequelize from "./config/db.js";
import logger from "./config/logger.js";
import { httpLogger } from "./middleware/loggingMiddleware.js";
import { autoMigrate } from "./auto-migrate.js";
import { helmetConfig, additionalSecurityHeaders } from "./middleware/securityMiddleware.js";
import swaggerSpec from './config/swagger.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'CLIENT_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

// Import all models to register them with Sequelize
import User from "./models/user.js";
import Resident from "./models/resident.js";
import Request from "./models/request.js";
import Complaint from "./models/complaint.js";
import Official from "./models/official.js";
import Announcement from "./models/announcement.js";
import Notification from "./models/notification.js";
import RefreshToken from "./models/refreshToken.js";
import RevokedToken from "./models/revokedToken.js";
import Image from "./models/image.js";
import AnnouncementReaction from "./models/announcementReaction.js";
import AnnouncementComment from "./models/announcementComment.js";

// Import routes
import apiRoutes from "./routes/index.js";
import initDbRouter from "./init-db-api.js";

// Import error middleware
import { errorMiddleware } from "./middleware/errorMiddlware.js";

// Import real-time sync service
import realTimeSyncService from "./services/realTimeSyncService.js";

const app = express();

// Trust proxy - needed for Railway deployment (behind reverse proxy)
app.set('trust proxy', 1);

const httpServer = createServer(app);

// Configure CORS origins for Socket.IO
const allowedOrigins = [
  'http://localhost:5173',
  'https://bakilidgov.vercel.app',
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Cleanup expired tokens periodically (every hour)
setInterval(async () => {
    try {
        const now = new Date();
        await RevokedToken.destroy({ where: { expiresAt: { [Sequelize.Op.lt]: now } } });
        await RefreshToken.destroy({ where: { expiresAt: { [Sequelize.Op.lt]: now } } });
        console.log("🧹 Cleaned up expired tokens");
    } catch (error) {
        console.error("Token cleanup error:", error);
    }
}, 60 * 60 * 1000); // 1 hour

// Middleware
app.use(helmetConfig); // Security headers
app.use(additionalSecurityHeaders); // Additional security headers

app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        // Don't throw error, just deny with callback(null, false)
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(httpLogger); // HTTP request logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Make io accessible to routes
app.set('io', io);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Root route
app.get("/", (req, res) => {
    res.json({ 
        message: "Barangay Bakilid API Server",
        version: "1.0.0",
        documentation: "/api-docs",
        endpoints: {
            auth: "/api/auth",
            residents: "/api/residents",
            requests: "/api/requests",
            complaints: "/api/complaints",
            announcements: "/api/announcements",
            logs: "/api/logs",
            health: "/api/health"
        }
    });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Barangay Bakilid API Documentation',
}));

// API Routes
logger.info("📍 Registering API routes...");
app.use("/api", apiRoutes);
app.use("/api/admin", initDbRouter); // Database initialization endpoint
logger.info("✅ API routes registered");

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);

  // Join room based on user ID
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`👤 User ${userId} joined their notification room`);
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Initialize real-time sync service with Socket.IO
realTimeSyncService.init(io);

// Database connection and sync
sequelize.authenticate()
    .then(() => {
        logger.info("✅ Database connected successfully");
        return sequelize.sync({ alter: false });
    })
    .then(async () => {
        logger.info("✅ Database synced");
        // Run automatic migrations
        await autoMigrate();
        httpServer.listen(PORT, () => {
            logger.info(`🚀 Server running on http://localhost:${PORT}`);
            logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            logger.info(`🏥 Health Check: http://localhost:${PORT}/api/health`);
            logger.info(`🔔 Socket.IO server ready for real-time notifications`);
            logger.info(`🔒 Security: Helmet headers enabled`);
            logger.info(`📝 Logging: Winston logger active`);
        });
    })
    .catch((error) => {
        logger.error("❌ Database connection error:", error);
        process.exit(1);
    });

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`\n${signal} received. Starting graceful shutdown...`);
    
    httpServer.close(async () => {
        logger.info('HTTP server closed');
        
        try {
            await sequelize.close();
            logger.info('Database connection closed');
            process.exit(0);
        } catch (err) {
            logger.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));