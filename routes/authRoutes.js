import express from "express";
import { register, login, refreshToken, logout } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { loginLimiter, registerLimiter, refreshTokenLimiter } from "../middleware/rateLimitMiddleware.js";
import { registerValidation, loginValidation, refreshTokenValidation, handleValidationErrors } from "../validators/authValidators.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new resident
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - birthDate
 *               - contactNumber
 *               - address
 *               - purok
 *             properties:
 *               username:
 *                 type: string
 *                 example: juan.delacruz
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               firstName:
 *                 type: string
 *                 example: Juan
 *               middleName:
 *                 type: string
 *                 example: Santos
 *               lastName:
 *                 type: string
 *                 example: Dela Cruz
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-15
 *               contactNumber:
 *                 type: string
 *                 example: '09123456789'
 *               address:
 *                 type: string
 *                 example: 123 Main St, Bakilid
 *               purok:
 *                 type: string
 *                 example: Purok 1
 *               validId:
 *                 type: string
 *                 format: binary
 *                 description: Valid ID image (JPEG, PNG, PDF)
 *               proofOfResidency:
 *                 type: string
 *                 format: binary
 *                 description: Proof of residency document (JPEG, PNG, PDF)
 *     responses:
 *       201:
 *         description: Registration submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or duplicate user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       429:
 *         description: Too many registration attempts
 */
router.post("/register", 
    registerLimiter, 
    upload.fields([
        { name: 'validId', maxCount: 1 },
        { name: 'proofOfResidency', maxCount: 1 }
    ]),
    registerValidation,
    handleValidationErrors,
    register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to the system
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account pending verification
 *       429:
 *         description: Too many login attempts
 */
router.post("/login", 
    loginLimiter, 
    loginValidation, 
    handleValidationErrors, 
    login
);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: a1b2c3d4e5f6...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh-token", 
    refreshTokenLimiter, 
    refreshTokenValidation, 
    handleValidationErrors, 
    refreshToken
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, async (req, res) => {
    try {
        // User is already attached by authMiddleware
        const user = {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            isVerified: req.user.isVerified
        };

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and revoke tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authMiddleware, logout);

export default router;