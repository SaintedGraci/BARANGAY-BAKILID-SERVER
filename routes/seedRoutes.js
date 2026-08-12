import express from 'express';
import bcryptjs from 'bcryptjs';
import User from '../models/user.js';
import Official from '../models/official.js';

const router = express.Router();

// Fix admin password endpoint
router.post('/fix-admin-password', async (req, res) => {
    try {
        const admin = await User.findOne({ where: { email: 'admin@bakilid.gov.ph' } });
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin user not found. Run /initialize-admin first.'
            });
        }

        // Update password to "admin123"
        const newPassword = await bcryptjs.hash('admin123', 10);
        await admin.update({ password: newPassword });

        res.status(200).json({
            success: true,
            message: 'Admin password reset successfully',
            email: 'admin@bakilid.gov.ph',
            password: 'admin123',
            note: 'You can now login with these credentials'
        });
    } catch (error) {
        console.error('Password fix error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fix admin password',
            error: error.message
        });
    }
});

// One-time seed endpoint (remove after use)
router.post('/initialize-admin', async (req, res) => {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ where: { email: 'admin@bakilid.gov.ph' } });
        
        if (existingAdmin) {
            return res.status(200).json({
                success: true,
                message: 'Admin account already exists',
                email: 'admin@bakilid.gov.ph',
                note: 'If password is not working, call /api/seed/fix-admin-password'
            });
        }

        // Create admin user
        const adminPassword = await bcryptjs.hash('admin123', 10);
        const adminUser = await User.create({
            username: 'admin',
            email: 'admin@bakilid.gov.ph',
            password: adminPassword,
            role: 'admin',
            isVerified: true,
            status: 'active'
        });

        // Create captain user
        const captainPassword = await bcryptjs.hash('captain123', 10);
        const captainUser = await User.create({
            username: 'captain',
            email: 'captain@bakilid.gov.ph',
            password: captainPassword,
            role: 'captain',
            isVerified: true,
            status: 'active'
        });

        // Create secretary user
        const secretaryPassword = await bcryptjs.hash('secretary123', 10);
        const secretaryUser = await User.create({
            username: 'secretary',
            email: 'secretary@bakilid.gov.ph',
            password: secretaryPassword,
            role: 'secretary',
            isVerified: true,
            status: 'active'
        });

        // Create staff user
        const staffPassword = await bcryptjs.hash('staff123', 10);
        const staffUser = await User.create({
            username: 'staff',
            email: 'staff@bakilid.gov.ph',
            password: staffPassword,
            role: 'staff',
            isVerified: true,
            status: 'active'
        });

        // Create Official records
        await Official.create({
            UserId: captainUser.id,
            firstName: 'Juan',
            middleName: 'Santos',
            lastName: 'Dela Cruz',
            position: 'Barangay Captain',
            contactNumber: '09171234567',
            email: 'captain@bakilid.gov.ph',
            termStart: new Date('2023-01-01'),
            termEnd: new Date('2026-12-31'),
            status: 'active'
        });

        await Official.create({
            UserId: secretaryUser.id,
            firstName: 'Ana',
            middleName: 'Cruz',
            lastName: 'Reyes',
            position: 'Barangay Secretary',
            contactNumber: '09181234567',
            email: 'secretary@bakilid.gov.ph',
            termStart: new Date('2023-01-01'),
            termEnd: new Date('2026-12-31'),
            status: 'active'
        });

        await Official.create({
            UserId: staffUser.id,
            firstName: 'Pedro',
            middleName: 'Gomez',
            lastName: 'Martinez',
            position: 'Barangay Staff',
            contactNumber: '09191234567',
            email: 'staff@bakilid.gov.ph',
            termStart: new Date('2023-01-01'),
            termEnd: new Date('2026-12-31'),
            status: 'active'
        });

        res.status(201).json({
            success: true,
            message: 'Admin accounts created successfully',
            accounts: [
                { email: 'admin@bakilid.gov.ph', password: 'admin123', role: 'admin' },
                { email: 'captain@bakilid.gov.ph', password: 'captain123', role: 'captain' },
                { email: 'secretary@bakilid.gov.ph', password: 'secretary123', role: 'secretary' },
                { email: 'staff@bakilid.gov.ph', password: 'staff123', role: 'staff' }
            ]
        });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin accounts',
            error: error.message
        });
    }
});

export default router;
