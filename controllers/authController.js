import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Resident from "../models/resident.js";
import Image from "../models/image.js";
import RefreshToken from "../models/refreshToken.js";
import RevokedToken from "../models/revokedToken.js";
import crypto from "crypto";
import { logAuthEvent, logSecurityEvent } from "../middleware/loggingMiddleware.js";
import { sendVerificationEmail, generateVerificationCode } from "../services/emailService.js";
import logger from "../config/logger.js";

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRES_IN = 7; // 7 days in days

export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
};

export const generateRefreshToken = async (user) => {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN);

    await RefreshToken.create({
        token,
        UserId: user.id,
        expiresAt
    });

    return token;
};

export const register = async (req, res) => {
    try {
        const {
            username, email, password,
            firstName, middleName, lastName, gender, birthDate, contactNumber, gmail,
            address, purok
        } = req.body;

        // Check if Gmail is already registered (if provided)
        if (gmail) {
            const existingGmail = await Resident.findOne({ 
                where: { gmail },
                include: [{ model: User, where: { isVerified: true } }]
            });
            
            if (existingGmail) {
                logSecurityEvent('REGISTRATION_ATTEMPT_DUPLICATE_GMAIL', { gmail }, req);
                return res.status(400).json({
                    success: false,
                    message: "This Gmail address is already registered"
                });
            }
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            logSecurityEvent('REGISTRATION_ATTEMPT_DUPLICATE_EMAIL', { email }, req);
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            logSecurityEvent('REGISTRATION_ATTEMPT_DUPLICATE_USERNAME', { username }, req);
            return res.status(400).json({
                success: false,
                message: "Username already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create new user with isVerified = false
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'resident',
            isVerified: false // User needs admin approval
        });

        // Handle file uploads from R2
        let validIdPath = null;
        let proofOfResidencyPath = null;
        
        try {
            validIdPath = req.files?.validId?.[0]?.r2Url || null;
            proofOfResidencyPath = req.files?.proofOfResidency?.[0]?.r2Url || null;
            
            console.log('✅ R2 Upload successful:', { validIdPath, proofOfResidencyPath });
        } catch (uploadError) {
            console.log('⚠️  File upload warning during registration:', uploadError.message);
        }

        // Create resident profile
        await Resident.create({
            UserId: newUser.id,
            firstName,
            middleName,
            lastName,
            gender,
            birthDate,
            contactNumber,
            gmail: gmail || null,
            address,
            purok,
            validIdPath,
            proofOfResidencyPath,
            verificationStatus: 'pending'
        });

        // Save document image metadata to images table
        if (validIdPath || proofOfResidencyPath) {
            try {
                if (validIdPath && req.files?.validId?.[0]) {
                    const file = req.files.validId[0];
                    const r2Key = file.r2Key || validIdPath.replace(process.env.R2_PUBLIC_URL + '/', '');
                    await Image.create({
                        originalName: file.originalname || 'valid-id',
                        r2Key: r2Key,
                        url: validIdPath,
                        size: file.size || 0,
                        mimetype: file.mimetype || 'image/webp',
                        category: 'documents',
                        relatedType: 'Resident',
                        relatedId: null, // Will be linked later after resident approval
                        uploadedBy: newUser.id,
                    });
                }
                
                if (proofOfResidencyPath && req.files?.proofOfResidency?.[0]) {
                    const file = req.files.proofOfResidency[0];
                    const r2Key = file.r2Key || proofOfResidencyPath.replace(process.env.R2_PUBLIC_URL + '/', '');
                    await Image.create({
                        originalName: file.originalname || 'proof-of-residency',
                        r2Key: r2Key,
                        url: proofOfResidencyPath,
                        size: file.size || 0,
                        mimetype: file.mimetype || 'image/webp',
                        category: 'documents',
                        relatedType: 'Resident',
                        relatedId: null,
                        uploadedBy: newUser.id,
                    });
                }
                console.log('✅ Document metadata saved to images table');
            } catch (dbError) {
                console.warn('⚠️ Failed to save document metadata:', dbError.message);
            }
        }

        logAuthEvent('REGISTRATION_SUCCESS', newUser.id, true, { email, username });

        // Check if email was pre-verified during Step 2
        let emailVerified = false;
        if (global.pendingVerifications && global.pendingVerifications.has(email)) {
            const verification = global.pendingVerifications.get(email);
            if (verification.verified) {
                emailVerified = true;
                // Mark email as verified
                await newUser.update({
                    isEmailVerified: true,
                    emailVerificationCode: null,
                    emailVerificationExpiry: null
                });
                // Clean up temporary storage
                global.pendingVerifications.delete(email);
                logger.info(`Email pre-verified during registration: ${email}`);
            }
        }

        // If email wasn't pre-verified, generate and send verification code
        if (!emailVerified) {
            try {
                const verificationCode = generateVerificationCode();
                const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

                // Store verification code in database
                await newUser.update({
                    emailVerificationCode: verificationCode,
                    emailVerificationExpiry: expiryTime,
                    isEmailVerified: false
                });

                // Send verification email
                await sendVerificationEmail(email, verificationCode, firstName || username);
                
                logger.info(`Verification email sent to ${email}`);
            } catch (emailError) {
                logger.error('Email sending failed:', emailError.message);
                // Don't fail registration if email fails
                // User can request resend later
            }
        }

        return res.status(201).json({
            success: true,
            message: emailVerified 
                ? "Registration submitted successfully. Awaiting admin approval."
                : "Registration submitted successfully. Please check your email for verification code.",
            data: {
                username: newUser.username,
                email: newUser.email,
                verificationStatus: 'pending',
                requiresEmailVerification: !emailVerified,
                isEmailVerified: emailVerified
            }
        });
    } catch (error) {
        console.error("Register error:", error);
        logSecurityEvent('REGISTRATION_ERROR', { error: error.message }, req);
        return res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, turnstileToken } = req.body;
        
        console.log('🔐 Login attempt:', { email, hasPassword: !!password, hasTurnstileToken: !!turnstileToken });

        // Verify Turnstile token first (skip in test mode)
        const skipTurnstile = process.env.SKIP_TURNSTILE === 'true' || turnstileToken === 'test-bypass-token';
        
        if (!skipTurnstile) {
            if (!turnstileToken) {
                console.log('❌ No Turnstile token provided');
                return res.status(400).json({
                    success: false,
                    message: "Verification required"
                });
            }

            // Verify with Cloudflare
            const turnstileVerifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
            const formData = new URLSearchParams();
            formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
            formData.append('response', turnstileToken);
            formData.append('remoteip', req.ip);

            try {
                const turnstileResponse = await fetch(turnstileVerifyUrl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                const turnstileResult = await turnstileResponse.json();
                console.log('🔒 Turnstile verification result:', turnstileResult.success);

                if (!turnstileResult.success) {
                    console.log('❌ Turnstile verification failed:', turnstileResult['error-codes']);
                    logSecurityEvent('LOGIN_TURNSTILE_FAILED', { email, errors: turnstileResult['error-codes'] }, req);
                    return res.status(403).json({
                        success: false,
                        message: "Verification failed. Please try again."
                    });
                }
            } catch (turnstileError) {
                console.error('❌ Turnstile verification error:', turnstileError);
                logSecurityEvent('LOGIN_TURNSTILE_ERROR', { email, error: turnstileError.message }, req);
                return res.status(500).json({
                    success: false,
                    message: "Verification service error. Please try again."
                });
            }
        } else {
            console.log('⚠️  Turnstile verification SKIPPED (test mode)');
        }

        // Determine if input is email or username
        const isEmail = email.includes('@');
        
        console.log('📧 Input type:', isEmail ? 'email' : 'username');
        
        // Find user by email or username
        const user = await User.findOne({ 
            where: isEmail ? { email } : { username: email }
        });
        
        if (!user) {
            console.log('❌ User not found:', email);
            logAuthEvent('LOGIN_FAILED', email, false, { reason: 'User not found', ip: req.ip });
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        console.log('✅ User found:', user.email, 'Role:', user.role);

        // Check if password matches
        const isPasswordCorrect = await bcryptjs.compare(password, user.password);
        console.log('🔑 Password check:', isPasswordCorrect ? 'MATCH' : 'NO MATCH');
        
        if (!isPasswordCorrect) {
            logAuthEvent('LOGIN_FAILED', user.id, false, { reason: 'Invalid password', ip: req.ip });
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Check if user is verified (for residents only)
        if (user.role === 'resident' && !user.isVerified) {
            logAuthEvent('LOGIN_FAILED', user.id, false, { reason: 'Account not verified', ip: req.ip });
            return res.status(403).json({
                success: false,
                message: "Your account is pending verification. Please wait for admin approval."
            });
        }

        // Check if user account is active
        if (user.status === 'inactive') {
            logAuthEvent('LOGIN_FAILED', user.id, false, { reason: 'Account inactive', ip: req.ip });
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact the administrator."
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        console.log('✅ Login successful for:', user.email);
        logAuthEvent('LOGIN_SUCCESS', user.id, true, { role: user.role, ip: req.ip });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token: accessToken,
            refreshToken,
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        logSecurityEvent('LOGIN_ERROR', { error: error.message }, req);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required",
                code: "REFRESH_TOKEN_REQUIRED"
            });
        }

        // Find the refresh token in database
        const storedToken = await RefreshToken.findOne({
            where: { token: refreshToken },
            include: [{ model: User, attributes: ['id', 'username', 'email', 'role', 'isVerified'] }]
        });

        if (!storedToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
                code: "INVALID_REFRESH_TOKEN"
            });
        }

        // Check if refresh token has expired
        if (new Date() > storedToken.expiresAt) {
            // Clean up expired token
            await storedToken.destroy();
            return res.status(401).json({
                success: false,
                message: "Refresh token has expired. Please login again.",
                code: "REFRESH_TOKEN_EXPIRED"
            });
        }

        const user = storedToken.User;

        // Generate new access token
        const newAccessToken = generateAccessToken(user);

        // Optionally rotate refresh token (good security practice)
        // Delete old refresh token and create new one
        await storedToken.destroy();
        const newRefreshToken = await generateRefreshToken(user);

        logAuthEvent('TOKEN_REFRESH_SUCCESS', user.id, true, { ip: req.ip });

        return res.status(200).json({
            success: true,
            token: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        logSecurityEvent('TOKEN_REFRESH_ERROR', { error: error.message }, req);
        return res.status(500).json({
            success: false,
            message: "Server error during token refresh"
        });
    }
};

export const logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const refreshToken = req.body.refreshToken;

        // Get access token from header
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const accessToken = authHeader.split(' ')[1];

            // Decode to get expiration time and blacklist the token
            try {
                const decoded = jwt.decode(accessToken);
                if (decoded && decoded.exp) {
                    await RevokedToken.create({
                        token: accessToken,
                        tokenType: 'access',
                        expiresAt: new Date(decoded.exp * 1000)
                    });
                }
            } catch (e) {
                // Token might be invalid format, continue with logout
                console.log("Could not decode access token for revocation:", e.message);
            }
        }

        // Revoke refresh token if provided
        if (refreshToken) {
            const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });
            if (storedToken) {
                await storedToken.destroy();
            }
        }

        // Clean up any refresh tokens for this user
        if (req.user) {
            await RefreshToken.destroy({ where: { UserId: req.user.id } });
        }

        logAuthEvent('LOGOUT_SUCCESS', req.user?.id || 'unknown', true, { ip: req.ip });

        console.log(`User ${req.user?.id || 'unknown'} logged out`);
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        logSecurityEvent('LOGOUT_ERROR', { error: error.message }, req);
        return res.status(500).json({
            success: false,
            message: "Logout failed"
        });
    }
};


// EMAIL VERIFICATION: Send verification code (before registration)
export const sendVerificationCode = async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Validate email format
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid Gmail address"
            });
        }

        // Check if email is already registered
        const existingUser = await User.findOne({ 
            where: { 
                email: email,
                isEmailVerified: true 
            } 
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "This email is already registered and verified"
            });
        }

        // Check if Gmail is already used by a verified resident
        const existingResident = await Resident.findOne({
            where: { gmail: email },
            include: [{ 
                model: User, 
                where: { isVerified: true },
                required: true
            }]
        });

        if (existingResident) {
            return res.status(400).json({
                success: false,
                message: "This Gmail address is already registered"
            });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store in session or temporary storage (using a Map for now)
        // In production, you might want to use Redis
        if (!global.pendingVerifications) {
            global.pendingVerifications = new Map();
        }
        
        global.pendingVerifications.set(email, {
            code: verificationCode,
            expiry: expiryTime,
            verified: false
        });

        // Send verification email
        await sendVerificationEmail(email, verificationCode, name || 'User');

        logger.info(`Verification code sent to ${email} (pre-registration)`);

        return res.status(200).json({
            success: true,
            message: "Verification code sent! Please check your email."
        });
    } catch (error) {
        console.error("Send verification code error:", error);
        
        if (error.message.includes('authentication failed') || error.message.includes('credentials')) {
            return res.status(500).json({
                success: false,
                message: "Email service is temporarily unavailable. Please try again later."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to send verification email. Please try again."
        });
    }
};

// EMAIL VERIFICATION: Verify code (before registration)
export const verifyCodeBeforeRegistration = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required"
            });
        }

        // Check pending verifications
        if (!global.pendingVerifications || !global.pendingVerifications.has(email)) {
            return res.status(400).json({
                success: false,
                message: "No verification code found. Please request a new one."
            });
        }

        const verification = global.pendingVerifications.get(email);

        // Check if code matches
        if (verification.code !== code) {
            logSecurityEvent('EMAIL_VERIFICATION_FAILED_INVALID_CODE', { email }, req);
            return res.status(400).json({
                success: false,
                message: "Invalid verification code"
            });
        }

        // Check if code expired
        if (new Date() > verification.expiry) {
            global.pendingVerifications.delete(email);
            logSecurityEvent('EMAIL_VERIFICATION_FAILED_EXPIRED', { email }, req);
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Please request a new one."
            });
        }

        // Mark as verified
        verification.verified = true;
        global.pendingVerifications.set(email, verification);

        logger.info(`Email verified (pre-registration): ${email}`);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully!"
        });
    } catch (error) {
        console.error("Verify code error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during verification"
        });
    }
};

// EMAIL VERIFICATION: Verify email with code
export const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required"
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if already verified
        if (user.isEmailVerified) {
            return res.status(200).json({
                success: true,
                message: "Email already verified"
            });
        }

        // Check if code matches
        if (user.emailVerificationCode !== code) {
            logSecurityEvent('EMAIL_VERIFICATION_FAILED_INVALID_CODE', { email }, req);
            return res.status(400).json({
                success: false,
                message: "Invalid verification code"
            });
        }

        // Check if code expired
        if (new Date() > new Date(user.emailVerificationExpiry)) {
            logSecurityEvent('EMAIL_VERIFICATION_FAILED_EXPIRED', { email }, req);
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Please request a new one."
            });
        }

        // Verify email
        await user.update({
            isEmailVerified: true,
            emailVerificationCode: null,
            emailVerificationExpiry: null
        });

        logAuthEvent('EMAIL_VERIFIED', user.id, true, { email });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully! Awaiting admin approval."
        });
    } catch (error) {
        console.error("Email verification error:", error);
        logSecurityEvent('EMAIL_VERIFICATION_ERROR', { error: error.message }, req);
        return res.status(500).json({
            success: false,
            message: "Server error during email verification"
        });
    }
};

// EMAIL VERIFICATION: Resend verification code
export const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if already verified
        if (user.isEmailVerified) {
            return res.status(200).json({
                success: true,
                message: "Email already verified"
            });
        }

        // Get resident for name
        const resident = await Resident.findOne({ where: { UserId: user.id } });
        const name = resident ? resident.firstName : user.username;

        // Generate new code
        const verificationCode = generateVerificationCode();
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new code
        await user.update({
            emailVerificationCode: verificationCode,
            emailVerificationExpiry: expiryTime
        });

        // Send verification email
        await sendVerificationEmail(email, verificationCode, name);

        logAuthEvent('VERIFICATION_CODE_RESENT', user.id, true, { email });

        return res.status(200).json({
            success: true,
            message: "Verification code sent! Please check your email."
        });
    } catch (error) {
        console.error("Resend verification code error:", error);
        
        // Handle specific email errors
        if (error.message.includes('authentication failed') || error.message.includes('credentials')) {
            return res.status(500).json({
                success: false,
                message: "Email service is temporarily unavailable. Please try again later."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to send verification email. Please try again."
        });
    }
};
