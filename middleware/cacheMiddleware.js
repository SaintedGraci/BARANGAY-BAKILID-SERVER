/**
 * Cache Middleware
 * 
 * Adds appropriate cache headers to API responses
 * for better performance and reduced server load
 */

/**
 * Add cache headers for static/immutable content
 * Use for: Images, documents, files that won't change
 */
export const cacheImmutable = (req, res, next) => {
    // Cache for 1 year, content is immutable
    res.set({
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
        'Cloudflare-CDN-Cache-Control': 'max-age=31536000'
    });
    next();
};

/**
 * Add cache headers for frequently changing content
 * Use for: Announcements, user data, dynamic content
 */
export const cacheShort = (req, res, next) => {
    // Cache for 5 minutes, must revalidate
    res.set({
        'Cache-Control': 'public, max-age=300, must-revalidate',
        'CDN-Cache-Control': 'public, max-age=300',
    });
    next();
};

/**
 * Add cache headers for API data that updates moderately
 * Use for: Lists, feeds, dashboards
 */
export const cacheMedium = (req, res, next) => {
    // Cache for 1 hour, stale-while-revalidate for better UX
    res.set({
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, max-age=3600',
    });
    next();
};

/**
 * No cache - always fetch fresh
 * Use for: Authentication, user-specific data, real-time data
 */
export const noCache = (req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });
    next();
};

/**
 * ETag-based conditional requests
 * Reduces bandwidth for unchanged resources
 */
export const etag = (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        // Generate ETag from response data
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
        const etag = `"${hash}"`;
        
        res.set('ETag', etag);
        
        // Check if client has cached version
        const clientEtag = req.headers['if-none-match'];
        if (clientEtag === etag) {
            return res.status(304).end();
        }
        
        return originalJson.call(this, data);
    };
    
    next();
};

export default {
    cacheImmutable,
    cacheShort,
    cacheMedium,
    noCache,
    etag
};
