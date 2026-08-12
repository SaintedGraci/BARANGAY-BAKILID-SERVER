import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import User from './models/user.js';

dotenv.config();

async function verifyAndFixAdminPassword() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Find admin user
        const admin = await User.findOne({ where: { email: 'admin@bakilid.gov.ph' } });
        
        if (!admin) {
            console.log('❌ Admin user not found');
            return;
        }

        console.log('\n📋 Admin User Info:');
        console.log('ID:', admin.id);
        console.log('Username:', admin.username);
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Current Password Hash:', admin.password.substring(0, 20) + '...');

        // Test if current password is "admin123"
        const testPassword = 'admin123';
        const isMatch = await bcryptjs.compare(testPassword, admin.password);
        
        console.log('\n🔐 Password Test:');
        console.log('Testing password: "admin123"');
        console.log('Match:', isMatch ? '✅ YES' : '❌ NO');

        if (!isMatch) {
            console.log('\n⚠️  Password does NOT match. Resetting to "admin123"...');
            const newHash = await bcryptjs.hash('admin123', 10);
            await admin.update({ password: newHash });
            console.log('✅ Password reset successfully!');
            console.log('New hash:', newHash.substring(0, 20) + '...');
            
            // Verify new password
            const verifyNew = await bcryptjs.compare('admin123', newHash);
            console.log('Verification:', verifyNew ? '✅ Password now works' : '❌ Still broken');
        } else {
            console.log('\n✅ Password is correct! Login should work.');
        }

        await sequelize.close();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyAndFixAdminPassword();
