import sequelize from './config/db.js';
import logger from './config/logger.js';

export async function autoMigrate() {
  try {
    // Check if status column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Users' 
        AND COLUMN_NAME = 'status';
    `);

    if (results.length === 0) {
      logger.info('⚙️ Running automatic migration: Adding status column to Users table...');
      
      // Add status column
      await sequelize.query(`
        ALTER TABLE Users 
        ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' 
        AFTER role;
      `);
      
      // Update existing users
      await sequelize.query(`
        UPDATE Users 
        SET status = 'active' 
        WHERE status IS NULL;
      `);
      
      logger.info('✅ Migration completed: status column added successfully');
    } else {
      logger.info('✓ Users table status column already exists');
    }

    // Check if contactNumber column exists
    const [contactResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Users' 
        AND COLUMN_NAME = 'contactNumber';
    `);

    if (contactResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Adding contactNumber column...');
      
      await sequelize.query(`
        ALTER TABLE Users 
        ADD COLUMN contactNumber VARCHAR(20) DEFAULT NULL 
        AFTER password;
      `);
      
      logger.info('✅ Migration completed: contactNumber column added');
    } else {
      logger.info('✓ Users table contactNumber column already exists');
    }

    // Check if fullName column exists
    const [nameResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Users' 
        AND COLUMN_NAME = 'fullName';
    `);

    if (nameResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Adding fullName column...');
      
      await sequelize.query(`
        ALTER TABLE Users 
        ADD COLUMN fullName VARCHAR(255) DEFAULT NULL 
        AFTER id;
      `);
      
      logger.info('✅ Migration completed: fullName column added');
    } else {
      logger.info('✓ Users table fullName column already exists');
    }

  } catch (error) {
    logger.error('❌ Auto-migration error:', error.message);
    // Don't crash the server, just log the error
  }
}
