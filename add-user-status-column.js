import sequelize from './config/db.js';

async function addStatusColumn() {
  try {
    console.log('Adding status column to Users table...');
    
    // Add status column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE Users 
      ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active'
      AFTER role;
    `);
    
    console.log('✅ Status column added successfully');
    
    // Update existing users to have active status
    await sequelize.query(`
      UPDATE Users 
      SET status = 'active' 
      WHERE status IS NULL;
    `);
    
    console.log('✅ Existing users updated to active status');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding status column:', error);
    process.exit(1);
  }
}

addStatusColumn();
