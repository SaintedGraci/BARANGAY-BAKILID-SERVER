import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const roleMiddleware = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // User should already be attached by authMiddleware
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            // Check if user role is in allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
            }

            next();
        } catch (error) {
            console.error("Role middleware error:", error);
            return res.status(500).json({ message: "Server error" });
        }
    };
};

// Helper middleware to require admin role
export const requireAdmin = roleMiddleware(['admin']);

// Helper middleware to require resident role
export const requireResident = roleMiddleware(['resident']);

// Helper middleware to allow both admin and resident
export const requireAuthenticated = roleMiddleware(['admin', 'resident']);
