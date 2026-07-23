// Simple API endpoint to initialize database
import express from 'express';
import sequelize from './config/db.js';
import bcrypt from 'bcryptjs';

// Import models
import User from './models/user.js';
import Resident from './models/resident.js';
import Request from './models/request.js';
import Complaint from './models/complaint.js';
import Official from './models/official.js';
import Announcement from './models/announcement.js';
import Notification from './models/notification.js';
import RefreshToken from './models/refreshToken.js';
import RevokedToken from './models/revokedToken.js';

const router = express.Router();

// Initialize database endpoint
router.post('/init-database', async (req, res) => {
    try {
        console.log('🔧 Starting database initialization...');
        
        // Sync database
        await sequelize.sync({ force: false, alter: true });
        console.log('✅ Database synced');

        // Check if admin exists
        const adminExists = await User.findOne({ where: { email: 'admin@bakilid.gov.ph' } });
        
        if (!adminExists) {
            // Create admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                username: 'admin',
                email: 'admin@bakilid.gov.ph',
                password: hashedPassword,
                role: 'admin',
                isVerified: true
            });
            console.log('✅ Admin user created');

            // Create captain user
            const captainPassword = await bcrypt.hash('captain123', 10);
            await User.create({
                username: 'captain',
                email: 'captain@bakilid.gov.ph',
                password: captainPassword,
                role: 'captain',
                isVerified: true
            });
            console.log('✅ Captain user created');

            // Create staff user
            const staffPassword = await bcrypt.hash('staff123', 10);
            await User.create({
                username: 'staff',
                email: 'staff@bakilid.gov.ph',
                password: staffPassword,
                role: 'staff',
                isVerified: true
            });
            console.log('✅ Staff user created');

            // Create test resident
            const residentPassword = await bcrypt.hash('resident123', 10);
            const residentUser = await User.create({
                username: 'testuser',
                email: 'testuser@example.com',
                password: residentPassword,
                role: 'resident',
                isVerified: true
            });

            await Resident.create({
                UserId: residentUser.id,
                firstName: 'Test',
                middleName: 'Sample',
                lastName: 'User',
                gender: 'Male',
                birthDate: '1990-01-01',
                contactNumber: '09123456789',
                purok: 'Purok 1',
                address: '123 Test Street, Bakilid',
                citizenship: 'Filipino',
                verificationStatus: 'verified'
            });
            console.log('✅ Test resident created');
        }

        res.json({
            success: true,
            message: 'Database initialized successfully',
            users: {
                admin: { email: 'admin@bakilid.gov.ph', password: 'admin123' },
                captain: { email: 'captain@bakilid.gov.ph', password: 'captain123' },
                staff: { email: 'staff@bakilid.gov.ph', password: 'staff123' },
                resident: { email: 'testuser@example.com', password: 'resident123' }
            }
        });

    } catch (error) {
        console.error('❌ Database initialization error:', error);
        res.status(500).json({
            success: false,
            message: 'Database initialization failed',
            error: error.message
        });
    }
});

export default router;
