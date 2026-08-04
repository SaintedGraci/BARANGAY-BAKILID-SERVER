import { sendVerificationEmail, generateVerificationCode } from '../services/emailService.js';
import logger from '../config/logger.js';

// Store verification codes temporarily (in production, use Redis)
const verificationCodes = new Map();

// Send verification code
export const sendVerificationCode = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    
    // Store code with expiration (10 minutes)
    const expiresAt = Date.now() + 10 * 60 * 1000;
    verificationCodes.set(email, { code, expiresAt, attempts: 0 });

    // Send email
    await sendVerificationEmail(email, code, name);

    logger.info(`Verification code sent to ${email}`);

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    logger.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send verification code'
    });
  }
};

// Verify code
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const stored = verificationCodes.get(email);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found for this email'
      });
    }

    // Check expiration
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Check attempts
    if (stored.attempts >= 3) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Verify code
    if (stored.code !== code) {
      stored.attempts += 1;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${3 - stored.attempts} attempts remaining.`
      });
    }

    // Code is valid, remove it
    verificationCodes.delete(email);

    logger.info(`Email verified successfully: ${email}`);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
};

// Clean up expired codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(email);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
