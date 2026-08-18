import Resident from "../models/resident.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { paginateQuery } from "../utils/pagination.js";
import APIResponse from "../utils/apiResponse.js";
import { convertObjectUrls } from "../utils/imageProxy.js";

// Get current resident's own profile
export const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user with resident information
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'role', 'isVerified', 'fullName', 'contactNumber', 'status', 'createdAt', 'updatedAt']
        });
        
        if (!user) {
            return APIResponse.notFound(res, "User not found");
        }
        
        // Get resident profile if exists
        const resident = await Resident.findOne({
            where: { UserId: userId }
        });
        
        const profileData = {
            user: user.get({ plain: true }),
            resident: resident ? convertObjectUrls(resident.get({ plain: true })) : null
        };
        
        return APIResponse.success(res, profileData, "Profile retrieved successfully");
    } catch (error) {
        console.error("Get my profile error:", error);
        return APIResponse.serverError(res, "Failed to retrieve profile", error);
    }
};

export const getAllResidents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const { rows: residents, pagination } = await paginateQuery(
            Resident,
            {
                include: [{
                    model: User,
                    attributes: ['id', 'username', 'email', 'role', 'isVerified', 'createdAt']
                }],
                order: [['createdAt', 'DESC']]
            },
            page,
            limit
        );
        
        // Convert R2 URLs to proxy URLs for documents
        const convertedResidents = residents.map(resident => {
            const plain = resident.get({ plain: true });
            return convertObjectUrls(plain);
        });
        
        return APIResponse.success(res, { residents: convertedResidents, pagination }, 'Residents retrieved successfully');
    } catch (error) {
        console.error("Get all residents error:", error);
        return APIResponse.serverError(res, "Failed to retrieve residents", error);
    }
};

export const getResidentById = async (req, res) => {
    try {
        const { id } = req.params;
        const resident = await Resident.findByPk(id);
        if (!resident) {
            return res.status(404).json({ message: "Resident not found" });
        }
        
        // Convert R2 URLs to proxy URLs
        const plain = resident.get({ plain: true });
        const converted = convertObjectUrls(plain);
        
        return res.status(200).json(converted);
    } catch (error) {
        console.error("Get resident error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const createResident = async (req, res) => {
    try {
        const { firstName, middleName, lastName, gender, birthDate, contactNumber, purok, address, citizenship, UserId } = req.body;

        // Validate input
        if (!firstName || !lastName) {
            return res.status(400).json({ message: "First name and last name are required" });
        }

        // Create new resident
        const newResident = await Resident.create({
            firstName,
            middleName,
            lastName,
            gender,
            birthDate,
            contactNumber,
            purok,
            address,
            citizenship,
            UserId
        });

        return res.status(201).json(newResident);
    } catch (error) {
        console.error("Create resident error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Create resident with user account (for admin use)
export const createResidentWithAccount = async (req, res) => {
    try {
        const { 
            username, 
            email, 
            password,
            firstName, 
            middleName, 
            lastName, 
            gender, 
            birthDate, 
            contactNumber, 
            purok, 
            address, 
            citizenship 
        } = req.body;

        // Validate required fields
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ 
                success: false,
                message: "Username, email, password, first name, and last name are required" 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            where: { 
                $or: [{ email }, { username }] 
            } 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: "User with this email or username already exists" 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user account
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'resident',
            isVerified: true // Auto-verify admin-created accounts
        });

        // Create resident profile
        const newResident = await Resident.create({
            firstName,
            middleName,
            lastName,
            gender,
            birthDate,
            contactNumber,
            purok,
            address,
            citizenship: citizenship || 'Filipino',
            UserId: newUser.id
        });

        // Fetch complete resident data with user info
        const residentWithUser = await Resident.findByPk(newResident.id, {
            include: [{
                model: User,
                attributes: ['id', 'username', 'email', 'role', 'isVerified', 'createdAt']
            }]
        });

        return res.status(201).json({
            success: true,
            message: "Resident created successfully",
            data: residentWithUser
        });
    } catch (error) {
        console.error("Create resident with account error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

export const updateResident = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, middleName, lastName, gender, birthDate, contactNumber, purok, address, citizenship } = req.body;

        // Find resident by ID
        const resident = await Resident.findByPk(id);
        if (!resident) {
            return res.status(404).json({ message: "Resident not found" });
        }

        // Update resident
        await resident.update({
            firstName,
            middleName,
            lastName,
            gender,
            birthDate,
            contactNumber,
            purok,
            address,
            citizenship
        });

        return res.status(200).json({ message: "Resident updated successfully", resident });
    } catch (error) {
        console.error("Update resident error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deleteResident = async (req, res) => {
    try {
        const { id } = req.params;

        // Find resident by ID
        const resident = await Resident.findByPk(id);
        if (!resident) {
            return res.status(404).json({ message: "Resident not found" });
        }

        // Delete resident
        await resident.destroy();

        return res.status(200).json({ message: "Resident deleted successfully" });
    } catch (error) {
        console.error("Delete resident error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


// Get pending verifications
export const getPendingVerifications = async (req, res) => {
    try {
        const pendingResidents = await Resident.findAll({
            where: { verificationStatus: 'pending' },
            include: [{
                model: User,
                attributes: ['id', 'username', 'email', 'isVerified', 'createdAt']
            }],
            order: [['createdAt', 'DESC']]
        });
        
        // Convert R2 URLs to proxy URLs for verification documents
        const convertedResidents = pendingResidents.map(resident => {
            const plain = resident.get({ plain: true });
            return convertObjectUrls(plain);
        });
        
        return res.status(200).json({
            success: true,
            data: convertedResidents
        });
    } catch (error) {
        console.error("Get pending verifications error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Server error" 
        });
    }
};

// Approve resident verification
export const approveResident = async (req, res) => {
    try {
        const { id } = req.params;
        
        const resident = await Resident.findByPk(id, {
            include: [User]
        });
        
        if (!resident) {
            return res.status(404).json({ 
                success: false,
                message: "Resident not found" 
            });
        }

        // Update resident verification status
        await resident.update({ verificationStatus: 'verified' });
        
        // Update user verification status
        await resident.User.update({ isVerified: true });

        return res.status(200).json({
            success: true,
            message: "Resident approved successfully",
            data: resident
        });
    } catch (error) {
        console.error("Approve resident error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Server error" 
        });
    }
};

// Reject resident verification
export const rejectResident = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const resident = await Resident.findByPk(id, {
            include: [User]
        });
        
        if (!resident) {
            return res.status(404).json({ 
                success: false,
                message: "Resident not found" 
            });
        }

        // Update resident verification status
        await resident.update({ verificationStatus: 'rejected' });
        
        // Keep user as not verified
        await resident.User.update({ isVerified: false });

        return res.status(200).json({
            success: true,
            message: "Resident verification rejected",
            data: resident
        });
    } catch (error) {
        console.error("Reject resident error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Server error" 
        });
    }
};

// Update resident profile (self)
export const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, middleName, email } = req.body;

        // Find the user's resident record
        const resident = await Resident.findOne({ where: { UserId: userId } });
        
        if (!resident) {
            return APIResponse.notFound(res, "Resident profile not found");
        }

        // Update resident name fields if provided
        const residentUpdates = {};
        if (firstName) residentUpdates.firstName = firstName;
        if (lastName) residentUpdates.lastName = lastName;
        if (middleName !== undefined) residentUpdates.middleName = middleName;

        if (Object.keys(residentUpdates).length > 0) {
            await resident.update(residentUpdates);
        }

        // Update user email if provided and different from current
        if (email && email !== req.user.email) {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return APIResponse.badRequest(res, "Invalid email format");
            }

            // Check if email already exists
            const existingUser = await User.findOne({ 
                where: { 
                    email,
                    id: { $ne: userId }
                } 
            });

            if (existingUser) {
                return APIResponse.badRequest(res, "Email address is already in use");
            }

            // Update email
            await User.update(
                { email },
                { where: { id: userId } }
            );
        }

        // Fetch updated data
        const updatedUser = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'role', 'isVerified', 'fullName', 'contactNumber', 'status', 'createdAt', 'updatedAt']
        });

        const updatedResident = await Resident.findOne({ where: { UserId: userId } });

        const profileData = {
            user: updatedUser.get({ plain: true }),
            resident: updatedResident ? convertObjectUrls(updatedResident.get({ plain: true })) : null
        };

        return APIResponse.success(res, profileData, "Profile updated successfully");
    } catch (error) {
        console.error("Update profile error:", error);
        return APIResponse.serverError(res, "Failed to update profile", error);
    }
};

// Change password (self)
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return APIResponse.badRequest(res, "Current password and new password are required");
        }

        if (newPassword.length < 6) {
            return APIResponse.badRequest(res, "New password must be at least 6 characters long");
        }

        // Get user with password
        const user = await User.findByPk(userId);
        
        if (!user) {
            return APIResponse.notFound(res, "User not found");
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            return APIResponse.unauthorized(res, "Current password is incorrect");
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await user.update({ password: hashedPassword });

        return APIResponse.success(res, null, "Password changed successfully");
    } catch (error) {
        console.error("Change password error:", error);
        return APIResponse.serverError(res, "Failed to change password", error);
    }
};
