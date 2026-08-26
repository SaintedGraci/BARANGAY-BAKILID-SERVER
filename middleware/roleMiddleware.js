import jwt from "jsonwebtoken";
import User from "../models/user.js";
import RolePermission from "../models/rolePermission.js";
import logger from "../config/logger.js";
import permissionCache from "../services/permissionCache.js";

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

// TASK15: Permission-based middleware for granular access control
export const requirePermission = (permissionKey) => {
    return async (req, res, next) => {
        try {
            // User should already be attached by authMiddleware
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const userRole = req.user.role;

            // Admin role has all permissions (bypass permission check)
            if (userRole === 'admin') {
                return next();
            }

            // Resident role cannot have admin permissions
            if (userRole === 'resident') {
                logger.warn(`Permission denied: Resident user ${req.user.id} attempted to access ${permissionKey}`);
                return res.status(403).json({ 
                    message: "Forbidden: This action requires administrative permissions" 
                });
            }

            // Check if role is valid for permission checking
            if (!['captain', 'secretary', 'staff'].includes(userRole)) {
                logger.warn(`Permission denied: Invalid role ${userRole} for user ${req.user.id}`);
                return res.status(403).json({ 
                    message: "Forbidden: Invalid role for this action" 
                });
            }

            // Try cache first
            let hasPermission = permissionCache.get(userRole, permissionKey);
            
            if (hasPermission === null) {
                // Cache miss - query database
                const rolePermission = await RolePermission.findOne({
                    where: {
                        role: userRole,
                        permissionKey: permissionKey,
                        granted: true,
                    },
                });

                hasPermission = !!rolePermission;
                
                // Cache the result
                permissionCache.set(userRole, permissionKey, hasPermission);
                
                logger.debug(`Permission cache MISS: ${userRole}:${permissionKey} = ${hasPermission}`);
            } else {
                logger.debug(`Permission cache HIT: ${userRole}:${permissionKey} = ${hasPermission}`);
            }

            if (!hasPermission) {
                logger.warn(`Permission denied: User ${req.user.id} (${userRole}) lacks permission: ${permissionKey}`);
                return res.status(403).json({ 
                    message: "Forbidden: You do not have permission to perform this action",
                    requiredPermission: permissionKey,
                });
            }

            // Permission granted
            next();
        } catch (error) {
            logger.error("Permission middleware error:", error);
            return res.status(500).json({ message: "Server error" });
        }
    };
};

// Helper to check multiple permissions (user needs ALL of them)
export const requirePermissions = (permissionKeys) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const userRole = req.user.role;

            // Admin role has all permissions
            if (userRole === 'admin') {
                return next();
            }

            // Resident role cannot have admin permissions
            if (userRole === 'resident') {
                return res.status(403).json({ 
                    message: "Forbidden: This action requires administrative permissions" 
                });
            }

            if (!['captain', 'secretary', 'staff'].includes(userRole)) {
                return res.status(403).json({ 
                    message: "Forbidden: Invalid role for this action" 
                });
            }

            // Check all permissions
            const permissionChecks = await Promise.all(
                permissionKeys.map(permKey =>
                    RolePermission.findOne({
                        where: {
                            role: userRole,
                            permissionKey: permKey,
                            granted: true,
                        },
                    })
                )
            );

            const missingPermissions = permissionKeys.filter((_, index) => !permissionChecks[index]);

            if (missingPermissions.length > 0) {
                logger.warn(`Permission denied: User ${req.user.id} (${userRole}) lacks permissions: ${missingPermissions.join(', ')}`);
                return res.status(403).json({ 
                    message: "Forbidden: You do not have all required permissions",
                    missingPermissions,
                });
            }

            next();
        } catch (error) {
            logger.error("Permissions middleware error:", error);
            return res.status(500).json({ message: "Server error" });
        }
    };
};

// Helper to check if user has ANY of the specified permissions
export const requireAnyPermission = (permissionKeys) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const userRole = req.user.role;

            // Admin role has all permissions
            if (userRole === 'admin') {
                return next();
            }

            // Resident role cannot have admin permissions
            if (userRole === 'resident') {
                return res.status(403).json({ 
                    message: "Forbidden: This action requires administrative permissions" 
                });
            }

            if (!['captain', 'secretary', 'staff'].includes(userRole)) {
                return res.status(403).json({ 
                    message: "Forbidden: Invalid role for this action" 
                });
            }

            // Check if user has ANY of the permissions
            const permissionCheck = await RolePermission.findOne({
                where: {
                    role: userRole,
                    permissionKey: permissionKeys,
                    granted: true,
                },
            });

            if (!permissionCheck) {
                logger.warn(`Permission denied: User ${req.user.id} (${userRole}) lacks any of: ${permissionKeys.join(', ')}`);
                return res.status(403).json({ 
                    message: "Forbidden: You do not have any of the required permissions",
                    requiredPermissions: permissionKeys,
                });
            }

            next();
        } catch (error) {
            logger.error("Any permission middleware error:", error);
            return res.status(500).json({ message: "Server error" });
        }
    };
};

// Helper middleware to require admin role
export const requireAdmin = roleMiddleware(['admin']);

// Helper middleware to require resident role
export const requireResident = roleMiddleware(['resident']);

// Helper middleware for captain (highest barangay authority)
export const requireCaptain = roleMiddleware(['captain', 'admin']);

// Helper middleware for secretary (administrative support)
export const requireSecretary = roleMiddleware(['secretary', 'captain', 'admin']);

// Helper middleware for staff (front-line service)
export const requireStaff = roleMiddleware(['staff', 'secretary', 'captain', 'admin']);

// Helper middleware for any barangay official
export const requireOfficial = roleMiddleware(['staff', 'secretary', 'captain', 'admin']);

// Helper middleware to allow both admin and resident
export const requireAuthenticated = roleMiddleware(['admin', 'captain', 'secretary', 'staff', 'resident']);

