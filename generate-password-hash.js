import bcryptjs from 'bcryptjs';

const password = 'admin123';
const hash = await bcryptjs.hash(password, 10);

console.log('\n🔐 Password Hash Generator');
console.log('========================');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nCopy this SQL to run in Railway MySQL:');
console.log(`UPDATE Users SET password = '${hash}' WHERE email = 'admin@bakilid.gov.ph';`);
