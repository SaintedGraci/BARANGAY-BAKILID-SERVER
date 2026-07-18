import sequelize from './config/db.js';

async function addImagePathColumn() {
  try {
    console.log('Checking if imagePath column exists...');
    
    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Announcements' 
      AND COLUMN_NAME = 'imagePath'
    `);
    
    if (results.length > 0) {
      console.log('✅ imagePath column already exists!');
    } else {
      console.log('Adding imagePath column...');
      await sequelize.query(`
        ALTER TABLE Announcements 
        ADD COLUMN imagePath VARCHAR(255) NULL
      `);
      console.log('✅ Successfully added imagePath column!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addImagePathColumn();
