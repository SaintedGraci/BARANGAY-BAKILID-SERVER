import rateLimit from 'express-rate-limit';

// Check if demo mode is enabled (disables rate limiting for demos)
const DEMO_MODE = process.env.DEMO_MODE === 'true';

if (DEMO_MODE) {
    console.log('⚠️  DEMO MODE ENABLED - Rate limiting is DISABLED');
}

// Strict rate limiter for login attempts (prevent brute force)
export const loginLimiter = DEMO_MODE 
    ? (req, res, next) => next() // Bypass in demo mode
    : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests
});

// Moderate rate limiter for registration (prevent spam)
export const registerLimiter = DEMO_MODE
    ? (req, res, next) => next() // Bypass in demo mode
    : rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registration requests per hour
    message: {
        success: false,
        message: 'Too many registration attempts from this IP, please try again after an hour',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter (prevent abuse)
export const apiLimiter = DEMO_MODE
    ? (req, res, next) => next() // Bypass in demo mode
    : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health check endpoint
        return req.path === '/api/health';
    }
});

// Refresh token limiter (prevent token refresh abuse)
export const refreshTokenLimiter = DEMO_MODE
    ? (req, res, next) => next() // Bypass in demo mode
    : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 refresh requests per windowMs
    message: {
        success: false,
        message: 'Too many token refresh attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
