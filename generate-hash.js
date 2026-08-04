import bcrypt from 'bcryptjs';

async function generateHash() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('\n🔐 Password Hash Generator');
    console.log('========================');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\n📋 SQL Update Query:');
    console.log(`UPDATE Users SET password = '${hash}' WHERE email = 'admin@bakilid.gov.ph';`);
}

generateHash().catch(console.error);
