import sequelize from './config/db.js';
import User from './models/user.js';

async function checkAdmin() {
  try {
    await sequelize.authenticate();
    const admin = await User.findOne({ where: { role: 'admin' } });
    
    if (admin) {
      console.log('Admin user found:');
      console.log('  ID:', admin.id);
      console.log('  Username:', admin.username);
      console.log('  Email:', admin.email);
      console.log('  Role:', admin.role);
    } else {
      console.log('No admin user found in database');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
