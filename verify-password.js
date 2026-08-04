import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function verifyPassword() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST || 'localhost',
        port: process.env.MYSQLPORT || 3306,
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '',
        database: process.env.MYSQLDATABASE || 'barangay_db'
    });

    console.log('✅ Connected to database');

    // Get the current admin user
    const [users] = await connection.execute(
        'SELECT id, email, password FROM Users WHERE email = ?',
        ['admin@bakilid.gov.ph']
    );

    if (users.length === 0) {
        console.log('❌ Admin user not found!');
        await connection.end();
        return;
    }

    const user = users[0];
    console.log('\n📋 Current User Info:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Current Hash:', user.password);

    // Test the current password
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('\n🔐 Password Test:');
    console.log('Testing password:', testPassword);
    console.log('Matches current hash?', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
        console.log('\n🔄 Generating new hash for admin123...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('New Hash:', newHash);
        
        // Update the user with the new hash
        await connection.execute(
            'UPDATE Users SET password = ? WHERE id = ?',
            [newHash, user.id]
        );
        
        console.log('✅ Password updated in database');
        
        // Verify the new hash works
        const verifyNew = await bcrypt.compare(testPassword, newHash);
        console.log('New hash verification:', verifyNew ? '✅ WORKS' : '❌ FAILED');
    }

    await connection.end();
}

verifyPassword().catch(console.error);
