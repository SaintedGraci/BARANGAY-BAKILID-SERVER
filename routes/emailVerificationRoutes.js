import express from 'express';
import { sendVerificationCode, verifyCode } from '../controllers/emailVerificationController.js';
import { apiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Send verification code
router.post('/send-code', apiLimiter, sendVerificationCode);

// Verify code
router.post('/verify-code', apiLimiter, verifyCode);

export default router;
