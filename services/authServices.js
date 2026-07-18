import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const registerUser = async (username, email, password, role = "resident") => {
    try {
        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error("Email already exists");
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create new user
        const newUser = await User.create({ 
            username, 
            email, 
            password: hashedPassword,
            role,
            isVerified: role !== "resident" // Auto-verify non-residents
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, role: newUser.role }, 
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { 
            success: true,
            message: "User created successfully", 
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        };
    } catch (error) {
        console.error("Register error:", error);
        return { 
            success: false,
            message: error.message || "Server error" 
        };
    }
};

export const loginUser = async (email, password) => {
    try {
        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error("Invalid email or password");
        }

        // Check if password matches
        const isPasswordCorrect = await bcryptjs.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new Error("Invalid email or password");
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { 
            success: true,
            message: "Login successful", 
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        };
    } catch (error) {
        console.error("Login error:", error);
        return { 
            success: false,
            message: error.message || "Server error" 
        };
    }
};

export const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            throw new Error("User not found");
        }

        return {
            success: true,
            user
        };
    } catch (error) {
        console.error("Verify token error:", error);
        return {
            success: false,
            message: error.message || "Invalid token"
        };
    }
};