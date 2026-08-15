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

    // Check if images table exists (TASK8)
    const [imageTableResults] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'images';
    `);

    if (imageTableResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Creating images table for TASK8...');
      
      await sequelize.query(`
        CREATE TABLE images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          original_name VARCHAR(255) NOT NULL COMMENT 'Original filename uploaded by user',
          r2_key VARCHAR(500) NOT NULL UNIQUE COMMENT 'Unique key/path in R2 bucket',
          url VARCHAR(1000) NOT NULL COMMENT 'Public CDN URL for the image',
          width INT NULL COMMENT 'Image width in pixels after optimization',
          height INT NULL COMMENT 'Image height in pixels after optimization',
          size INT NOT NULL COMMENT 'File size in bytes after optimization',
          mimetype VARCHAR(50) NOT NULL DEFAULT 'image/webp' COMMENT 'MIME type (should be image/webp)',
          category VARCHAR(100) NULL COMMENT 'Category/folder: announcements, documents, profiles, etc.',
          related_type VARCHAR(100) NULL COMMENT 'Related entity type: Announcement, Resident, Request, etc.',
          related_id INT NULL COMMENT 'ID of the related entity',
          uploaded_by INT NULL COMMENT 'User ID who uploaded the image',
          is_deleted BOOLEAN DEFAULT FALSE COMMENT 'Soft delete flag',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_r2_key (r2_key),
          INDEX idx_category (category),
          INDEX idx_related (related_type, related_id),
          INDEX idx_uploaded_by (uploaded_by),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
        COMMENT='Stores optimized image metadata for Cloudflare R2 storage';
      `);
      
      logger.info('✅ Migration completed: images table created successfully');
      logger.info('📸 TASK8 image optimization system is now active');
    } else {
      logger.info('✓ Images table already exists (TASK8)');
    }

    // Check if isPinned column exists in Announcements (TASK10)
    const [pinnedResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Announcements' 
        AND COLUMN_NAME = 'isPinned';
    `);

    if (pinnedResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Adding isPinned column to Announcements...');
      
      await sequelize.query(`
        ALTER TABLE Announcements 
        ADD COLUMN isPinned BOOLEAN DEFAULT FALSE NOT NULL 
        AFTER imagePath;
      `);
      
      logger.info('✅ Migration completed: isPinned column added to Announcements');
    } else {
      logger.info('✓ Announcements isPinned column already exists');
    }

    // Check if category column exists in Announcements (TASK10)
    const [categoryResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Announcements' 
        AND COLUMN_NAME = 'category';
    `);

    if (categoryResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Adding category column to Announcements...');
      
      await sequelize.query(`
        ALTER TABLE Announcements 
        ADD COLUMN category ENUM('General', 'Event', 'Advisory', 'Emergency', 'Community') 
        DEFAULT 'General' 
        AFTER isPinned;
      `);
      
      logger.info('✅ Migration completed: category column added to Announcements');
      logger.info('📢 TASK10 modern announcement feed is now active');
    } else {
      logger.info('✓ Announcements category column already exists');
    }

    // Check if thumbnailUrl column exists in Announcements (TASK11)
    const [thumbnailResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Announcements' 
        AND COLUMN_NAME = 'thumbnailUrl';
    `);

    if (thumbnailResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Adding image variant columns to Announcements (TASK11)...');
      
      // Add thumbnailUrl column
      await sequelize.query(`
        ALTER TABLE Announcements 
        ADD COLUMN thumbnailUrl VARCHAR(255) NULL 
        AFTER imagePath;
      `);
      
      // Add mediumUrl column
      await sequelize.query(`
        ALTER TABLE Announcements 
        ADD COLUMN mediumUrl VARCHAR(255) NULL 
        AFTER thumbnailUrl;
      `);
      
      // Add largeUrl column
      await sequelize.query(`
        ALTER TABLE Announcements 
        ADD COLUMN largeUrl VARCHAR(255) NULL 
        AFTER mediumUrl;
      `);
      
      logger.info('✅ Migration completed: Image variant columns added to Announcements');
      logger.info('🖼️  TASK11 responsive image loading is now active');
      logger.info('   - Thumbnail (400w), Medium (800w), Large (1200w)');
      logger.info('   - WebP format with optimized quality');
      logger.info('   - Browser-native responsive images with srcSet');
    } else {
      logger.info('✓ Announcements image variant columns already exist (TASK11)');
    }

  } catch (error) {
    logger.error('❌ Auto-migration error:', error.message);
    // Don't crash the server, just log the error
  }
}
