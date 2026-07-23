import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function fixAdminPassword() {
    console.log('🔧 Fixing admin password...\n');

    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST || 'localhost',
        port: process.env.MYSQLPORT || 3306,
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '',
        database: process.env.MYSQLDATABASE || 'barangay_db'
    });

    console.log('✅ Connected to database');

    // Generate new hash for 'admin123'
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('📋 New password info:');
    console.log('Password:', newPassword);
    console.log('Hash:', hashedPassword);

    // Update the admin user
    const [result] = await connection.execute(
        'UPDATE Users SET password = ? WHERE email = ?',
        [hashedPassword, 'admin@bakilid.gov.ph']
    );

    console.log('\n✅ Update result:', result.affectedRows, 'row(s) updated');

    // Verify the update
    const [users] = await connection.execute(
        'SELECT id, email, role, password FROM Users WHERE email = ?',
        ['admin@bakilid.gov.ph']
    );

    if (users.length > 0) {
        console.log('\n📋 Updated user:');
        console.log('ID:', users[0].id);
        console.log('Email:', users[0].email);
        console.log('Role:', users[0].role);
        console.log('Password hash:', users[0].password);

        // Verify the password works
        const isValid = await bcrypt.compare(newPassword, users[0].password);
        console.log('\n🔐 Password verification:', isValid ? '✅ VALID' : '❌ INVALID');
    }

    await connection.end();
    console.log('\n✅ Done!');
}

fixAdminPassword().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});
