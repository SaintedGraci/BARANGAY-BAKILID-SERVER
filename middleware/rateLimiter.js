/**
 * Rate Limiter Middleware
 * Protects endpoints from spam/abuse by limiting requests per IP
 */

// Store for tracking requests: { ip: { count, resetTime } }
const requestStore = new Map();

/**
 * Creates a rate limiter middleware
 * @param {number} maxRequests - Maximum requests allowed in the time window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware
 */
export const createRateLimiter = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        // Get client IP (handle proxy forwarding)
        const ip = req.ip || 
                   req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.connection.remoteAddress;

        const now = Date.now();
        const record = requestStore.get(ip);

        // Clean up old records periodically (every 5 minutes)
        if (Math.random() < 0.01) {
            for (const [key, value] of requestStore.entries()) {
                if (now > value.resetTime) {
                    requestStore.delete(key);
                }
            }
        }

        // First request from this IP
        if (!record) {
            requestStore.set(ip, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }

        // Reset window has passed
        if (now > record.resetTime) {
            requestStore.set(ip, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }

        // Within window - check limit
        if (record.count >= maxRequests) {
            const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
            return res.status(429).json({
                success: false,
                message: `Too many requests. Please try again in ${resetInSeconds} seconds`,
                retryAfter: resetInSeconds
            });
        }

        // Increment count
        record.count++;
        return next();
    };
};

/**
 * Pre-configured rate limiters for common use cases
 */

// Strict - For sensitive operations like sending emails (5 requests per 15 minutes)
export const strictRateLimiter = createRateLimiter(5, 15 * 60 * 1000);

// Standard - For normal API endpoints (100 requests per 15 minutes)
export const standardRateLimiter = createRateLimiter(100, 15 * 60 * 1000);

// Lenient - For public endpoints (500 requests per 15 minutes)
export const lenientRateLimiter = createRateLimiter(500, 15 * 60 * 1000);
