/**
 * Email-Specific Rate Limiter
 * Prevents spam by tracking per-email cooldowns and daily limits
 */

// In-memory stores (in production, use Redis for distributed systems)
const emailCooldowns = new Map(); // { email: lastSentTimestamp }
const dailyEmailCounts = new Map(); // { email: { count, resetTime } }
const failedVerificationAttempts = new Map(); // { email: { count, lockUntil } }

const COOLDOWN_SECONDS = 60; // 60 seconds between emails
const MAX_DAILY_EMAILS = 5; // Max 5 verification emails per day per email
const MAX_FAILED_ATTEMPTS = 5; // Max 5 failed verification attempts
const FAILED_ATTEMPTS_LOCKOUT_MINUTES = 15; // 15 minute lockout after max failures

/**
 * Clean up old records periodically
 */
const cleanup = () => {
    const now = Date.now();
    
    // Clean up expired cooldowns (older than 2 minutes)
    for (const [email, timestamp] of emailCooldowns.entries()) {
        if (now - timestamp > 2 * 60 * 1000) {
            emailCooldowns.delete(email);
        }
    }
    
    // Clean up expired daily counts
    for (const [email, data] of dailyEmailCounts.entries()) {
        if (now > data.resetTime) {
            dailyEmailCounts.delete(email);
        }
    }
    
    // Clean up expired failed attempt locks
    for (const [email, data] of failedVerificationAttempts.entries()) {
        if (now > data.lockUntil) {
            failedVerificationAttempts.delete(email);
        }
    }
};

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

/**
 * Check if email can send verification code
 */
export const checkEmailSendLimit = (req, res, next) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }
    
    const now = Date.now();
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if account is locked due to failed attempts
    const failedAttempts = failedVerificationAttempts.get(normalizedEmail);
    if (failedAttempts && now < failedAttempts.lockUntil) {
        const remainingMinutes = Math.ceil((failedAttempts.lockUntil - now) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Too many failed verification attempts. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`,
            locked: true,
            retryAfter: Math.ceil((failedAttempts.lockUntil - now) / 1000)
        });
    }
    
    // Check cooldown (per email)
    const lastSent = emailCooldowns.get(normalizedEmail);
    if (lastSent) {
        const timeSinceLastEmail = (now - lastSent) / 1000;
        if (timeSinceLastEmail < COOLDOWN_SECONDS) {
            const remainingSeconds = Math.ceil(COOLDOWN_SECONDS - timeSinceLastEmail);
            return res.status(429).json({
                success: false,
                message: `Please wait ${remainingSeconds} seconds before requesting another code`,
                cooldown: true,
                retryAfter: remainingSeconds
            });
        }
    }
    
    // Check daily limit
    const dailyData = dailyEmailCounts.get(normalizedEmail);
    if (dailyData) {
        if (now < dailyData.resetTime) {
            // Still within 24-hour window
            if (dailyData.count >= MAX_DAILY_EMAILS) {
                const hoursRemaining = Math.ceil((dailyData.resetTime - now) / (60 * 60 * 1000));
                return res.status(429).json({
                    success: false,
                    message: `Daily email limit reached. Try again in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}`,
                    dailyLimit: true,
                    retryAfter: Math.ceil((dailyData.resetTime - now) / 1000)
                });
            }
        } else {
            // 24-hour window expired, reset counter
            dailyEmailCounts.delete(normalizedEmail);
        }
    }
    
    // Store current timestamp for cooldown
    emailCooldowns.set(normalizedEmail, now);
    
    // Update daily count
    if (dailyData && now < dailyData.resetTime) {
        dailyData.count++;
    } else {
        dailyEmailCounts.set(normalizedEmail, {
            count: 1,
            resetTime: now + (24 * 60 * 60 * 1000) // 24 hours
        });
    }
    
    next();
};

/**
 * Track failed verification attempts
 */
export const trackFailedVerification = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    
    const attempts = failedVerificationAttempts.get(normalizedEmail);
    if (attempts) {
        attempts.count++;
        if (attempts.count >= MAX_FAILED_ATTEMPTS) {
            attempts.lockUntil = now + (FAILED_ATTEMPTS_LOCKOUT_MINUTES * 60 * 1000);
        }
    } else {
        failedVerificationAttempts.set(normalizedEmail, {
            count: 1,
            lockUntil: 0
        });
    }
};

/**
 * Reset failed verification attempts (on successful verification)
 */
export const resetFailedVerification = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    failedVerificationAttempts.delete(normalizedEmail);
};

/**
 * Get remaining cooldown time for an email
 */
export const getCooldownRemaining = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const lastSent = emailCooldowns.get(normalizedEmail);
    
    if (!lastSent) return 0;
    
    const now = Date.now();
    const timeSinceLastEmail = (now - lastSent) / 1000;
    const remaining = Math.max(0, COOLDOWN_SECONDS - timeSinceLastEmail);
    
    return Math.ceil(remaining);
};

export default {
    checkEmailSendLimit,
    trackFailedVerification,
    resetFailedVerification,
    getCooldownRemaining
};
