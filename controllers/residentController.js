import Resident from "../models/resident.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { paginateQuery } from "../utils/pagination.js";
import APIResponse from "../utils/apiResponse.js";

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
        
        return APIResponse.success(res, { residents, pagination }, 'Residents retrieved successfully');
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
        return res.status(200).json(resident);
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
        
        return res.status(200).json({
            success: true,
            data: pendingResidents
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
