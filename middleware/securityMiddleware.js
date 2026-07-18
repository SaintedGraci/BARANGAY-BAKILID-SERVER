import helmet from 'helmet';

/**
 * Helmet.js security middleware configuration
 * Adds various HTTP security headers to protect against common vulnerabilities
 */
export const helmetConfig = helmet({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "http://localhost:5173", "ws://localhost:5000"], // Allow WebSocket
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    
    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Disable for development (enable in production)
    
    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },
    
    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
    
    // Expect-CT header (deprecated but still useful)
    expectCt: {
        enforce: true,
        maxAge: 86400, // 24 hours
    },
    
    // Referrer-Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    
    // HTTP Strict Transport Security (HSTS)
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // X-DNS-Prefetch-Control
    dnsPrefetchControl: { allow: false },
    
    // X-Download-Options
    ieNoOpen: true,
    
    // X-Frame-Options
    frameguard: { action: "deny" },
    
    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    
    // Hide X-Powered-By header
    hidePoweredBy: true,
    
    // X-XSS-Protection (legacy but still useful)
    xssFilter: true,
});

/**
 * Additional security headers for API responses
 */
export const additionalSecurityHeaders = (req, res, next) => {
    // Prevent caching of sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Feature Policy / Permissions Policy
    res.setHeader('Permissions-Policy', 
        'geolocation=(), microphone=(), camera=(), payment=()');
    
    next();
};

export default helmetConfig;
