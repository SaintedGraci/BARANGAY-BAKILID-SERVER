import jwt from "jsonwebtoken";
import User from "../models/user.js";
import RevokedToken from "../models/revokedToken.js";

export const authMiddleware = async (req, res, next) => {
    try {
        // Check if token is present in the header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided"
            });
        }

        const token = authHeader.split(' ')[1];

        // Check if token is revoked (blacklisted)
        const revoked = await RevokedToken.findOne({ where: { token } });
        if (revoked) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Token has been revoked",
                code: "TOKEN_REVOKED"
            });
        }

        // Verify token and handle expiration specifically
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Token has expired",
                    code: "TOKEN_EXPIRED"
                });
            }
            throw jwtError;
        }

        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid token",
            code: "INVALID_TOKEN"
        });
    }
};
