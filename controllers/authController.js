import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Resident from "../models/resident.js";
import Image from "../models/image.js";
import RefreshToken from "../models/refreshToken.js";
import RevokedToken from "../models/revokedToken.js";
import crypto from "crypto";
import { logAuthEvent, logSecurityEvent } from "../middleware/loggingMiddleware.js";

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

        return res.status(201).json({
            success: true,
            message: "Registration submitted successfully. Please wait for admin verification.",
            data: {
                username: newUser.username,
                email: newUser.email,
                verificationStatus: 'pending'
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
        const { email, password } = req.body; // 'email' field contains either email or username
        
        console.log('🔐 Login attempt:', { email, hasPassword: !!password });

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