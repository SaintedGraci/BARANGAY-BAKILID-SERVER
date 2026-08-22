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

    // Update Announcements category enum to match UI tabs
    const [categoryEnumCheck] = await sequelize.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Announcements' 
        AND COLUMN_NAME = 'category';
    `);

    if (categoryEnumCheck.length > 0) {
      const currentEnum = categoryEnumCheck[0].COLUMN_TYPE;
      // Check if enum needs updating (doesn't have new values)
      if (!currentEnum.includes('Important') || !currentEnum.includes('Advisories')) {
        logger.info('⚙️ Running automatic migration: Updating category enum to match UI...');
        
        // IMPORTANT: Map old values FIRST before MODIFY COLUMN drops them from the enum.
        // MySQL sets rows with removed enum values to '' (empty string) during MODIFY,
        // so the UPDATEs must run while the old values are still valid.
        await sequelize.query(`UPDATE Announcements SET category = 'Events' WHERE category = 'Event'`);
        await sequelize.query(`UPDATE Announcements SET category = 'Advisories' WHERE category = 'Advisory'`);
        await sequelize.query(`UPDATE Announcements SET category = 'General' WHERE category = 'Community'`);

        // Now safe to modify the enum — no rows hold the old values anymore
        await sequelize.query(`
          ALTER TABLE Announcements 
          MODIFY COLUMN category 
          ENUM('General', 'Emergency', 'Important', 'Events', 'Advisories') 
          DEFAULT 'General';
        `);
        
        logger.info('✅ Migration completed: Category enum updated to match UI tabs');
        logger.info('   Categories: General, Emergency, Important, Events, Advisories');
      } else {
        logger.info('✓ Announcements category enum is up to date');
      }
    }

    // Check if AnnouncementReactions table exists (DEBUG1 - Helpful Reaction Fix)
    const [reactionsTableResults] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'AnnouncementReactions';
    `);

    if (reactionsTableResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Creating AnnouncementReactions table (DEBUG1)...');
      
      await sequelize.query(`
        CREATE TABLE AnnouncementReactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          announcementId INT NOT NULL,
          userId INT NOT NULL,
          type ENUM('helpful', 'like') DEFAULT 'helpful',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_reaction (announcementId, userId),
          FOREIGN KEY (announcementId) REFERENCES Announcements(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
          INDEX idx_announcement (announcementId),
          INDEX idx_user (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
        COMMENT='Stores user reactions (helpful/like) on announcements';
      `);
      
      logger.info('✅ Migration completed: AnnouncementReactions table created');
      logger.info('👍 DEBUG1: Helpful reaction feature with green button is now active');
    } else {
      logger.info('✓ AnnouncementReactions table already exists');
      
      // Check if unique constraint exists on existing table
      const [uniqueConstraintCheck] = await sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'AnnouncementReactions'
          AND CONSTRAINT_TYPE = 'UNIQUE';
      `);
      
      if (uniqueConstraintCheck.length === 0) {
        logger.info('⚙️ Adding unique constraint to existing AnnouncementReactions table (DEBUG1)...');
        
        // Remove any duplicate reactions first
        await sequelize.query(`
          DELETE t1 FROM AnnouncementReactions t1
          INNER JOIN AnnouncementReactions t2 
          WHERE t1.id > t2.id 
            AND t1.announcementId = t2.announcementId 
            AND t1.userId = t2.userId;
        `);
        
        // Add unique constraint
        await sequelize.query(`
          ALTER TABLE AnnouncementReactions 
          ADD UNIQUE KEY unique_reaction (announcementId, userId);
        `);
        
        logger.info('✅ Unique constraint added to AnnouncementReactions (DEBUG1)');
        logger.info('🔒 Duplicate reactions are now prevented at database level');
      } else {
        logger.info('✓ Unique constraint already exists on AnnouncementReactions');
      }
    }

    // Check if AnnouncementComments table exists
    const [commentsTableResults] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'AnnouncementComments';
    `);

    if (commentsTableResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Creating AnnouncementComments table...');
      
      await sequelize.query(`
        CREATE TABLE AnnouncementComments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          announcementId INT NOT NULL,
          userId INT NOT NULL,
          comment TEXT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (announcementId) REFERENCES Announcements(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
          INDEX idx_announcement_created (announcementId, createdAt),
          INDEX idx_user (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
        COMMENT='Stores user comments on announcements';
      `);
      
      logger.info('✅ Migration completed: AnnouncementComments table created');
      logger.info('💬 Announcement reactions and comments feature is now active');
    } else {
      logger.info('✓ AnnouncementComments table already exists');
    }

  } catch (error) {
    logger.error('❌ Auto-migration error:', error.message);
    logger.error('Stack trace:', error.stack);
    // Don't crash the server, just log the error
  }
}
