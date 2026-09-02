/**
 * Convert R2 public URL to Railway proxy URL
 * This bypasses R2.dev URL DNS issues
 * 
 * @param {string} r2Url - R2 public URL
 * @param {string} backendUrl - Railway backend URL (from env)
 * @returns {string} - Proxied URL through Railway
 */
export function convertToProxyUrl(r2Url, backendUrl = process.env.BACKEND_URL) {
    if (!r2Url) return null;
    
    // Extract the key from R2 URL
    // Example: https://pub-xxx.r2.dev/announcements/123.webp -> announcements/123.webp
    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    const key = r2Url.replace(`${r2PublicUrl}/`, '');
    
    // Return proxy URL
    return `${backendUrl}/api/proxy/image?key=${encodeURIComponent(key)}`;
}

/**
 * Convert multiple R2 URLs in an object to proxy URLs
 * @param {Object} obj - Object containing R2 URLs
 * @param {Array<string>} fields - Fields to convert
 * @returns {Object} - Object with converted URLs
 */
export function convertObjectUrls(obj, fields = ['imagePath', 'thumbnailUrl', 'mediumUrl', 'largeUrl', 'validIdPath', 'proofOfResidencyPath', 'selfieUrl']) {
    if (!obj) return obj;
    
    const converted = { ...obj };
    const backendUrl = process.env.BACKEND_URL || 'https://your-railway-backend.railway.app';
    
    for (const field of fields) {
        if (converted[field] && converted[field].includes('r2.dev')) {
            converted[field] = convertToProxyUrl(converted[field], backendUrl);
        }
    }
    
    return converted;
}

export default { convertToProxyUrl, convertObjectUrls };
