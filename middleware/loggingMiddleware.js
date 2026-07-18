import morgan from 'morgan';
import logger from '../config/logger.js';

// Custom Morgan token for user ID
morgan.token('user-id', (req) => {
    return req.user ? req.user.id : 'anonymous';
});

// Custom Morgan token for user role
morgan.token('user-role', (req) => {
    return req.user ? req.user.role : 'none';
});

// Custom format with user context
const customFormat = ':remote-addr - :user-id [:user-role] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Morgan middleware for HTTP request logging
export const httpLogger = morgan(customFormat, {
    stream: logger.stream,
    skip: (req) => {
        // Skip health check endpoint to reduce noise
        return req.url === '/api/health';
    }
});

// Security event logger
export const logSecurityEvent = (event, details, req = null) => {
    const logData = {
        event,
        timestamp: new Date().toISOString(),
        ip: req ? (req.ip || req.connection.remoteAddress) : 'unknown',
        userAgent: req ? req.get('user-agent') : 'unknown',
        userId: req?.user?.id || 'anonymous',
        userRole: req?.user?.role || 'none',
        ...details
    };

    logger.warn(`SECURITY: ${event}`, logData);
};

// Authentication event logger
export const logAuthEvent = (event, userId, success, details = {}) => {
    const logData = {
        event,
        userId,
        success,
        timestamp: new Date().toISOString(),
        ...details
    };

    if (success) {
        logger.info(`AUTH: ${event}`, logData);
    } else {
        logger.warn(`AUTH: ${event} - FAILED`, logData);
    }
};

// Database query logger (for slow queries)
export const logSlowQuery = (query, duration, params = {}) => {
    if (duration > 1000) { // Log queries taking more than 1 second
        logger.warn(`SLOW_QUERY: ${duration}ms`, {
            query,
            duration,
            params,
            timestamp: new Date().toISOString()
        });
    }
};

// Error logger with context
export const logError = (error, req = null, additionalContext = {}) => {
    const errorData = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: req?.url,
        method: req?.method,
        ip: req ? (req.ip || req.connection.remoteAddress) : 'unknown',
        userId: req?.user?.id || 'anonymous',
        ...additionalContext
    };

    logger.error('ERROR', errorData);
};

export default logger;
