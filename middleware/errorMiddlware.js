import logger from "../config/logger.js";

export const errorMiddleware = (err, req, res, next) => {
    logger.error("Error:", {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });
    
    // Don't expose internal error details in production
    const isDev = process.env.NODE_ENV !== 'production';
    
    return res.status(err.status || 500).json({ 
        success: false,
        message: isDev ? err.message : "Internal server error",
        ...(isDev && { stack: err.stack })
    });
};