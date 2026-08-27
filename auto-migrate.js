import sequelize from './config/db.js';
import logger from './config/logger.js';

export async function autoMigrate() {
  try {
    logger.info('🚀 Starting auto-migration process...');
    
    // Test database connection first
    await sequelize.authenticate();
    logger.info('✅ Database connection established');
    
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

    // Check if email verification columns exist (EMAIL_VERIFICATION)
    const [emailVerifResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Users' 
        AND COLUMN_NAME = 'emailVerificationCode';
    `);

    if (emailVerifResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Adding email verification columns to Users table...');
      
      await sequelize.query(`
        ALTER TABLE Users 
        ADD COLUMN emailVerificationCode VARCHAR(10) NULL COMMENT 'Email verification code' AFTER isVerified,
        ADD COLUMN emailVerificationExpiry DATETIME NULL COMMENT 'Verification code expiry time' AFTER emailVerificationCode,
        ADD COLUMN isEmailVerified BOOLEAN DEFAULT FALSE COMMENT 'Email verification status' AFTER emailVerificationExpiry;
      `);
      
      // Update existing users - mark admin users as email verified
      await sequelize.query(`
        UPDATE Users 
        SET isEmailVerified = TRUE 
        WHERE role IN ('admin', 'captain', 'secretary', 'staff');
      `);
      
      logger.info('✅ Migration completed: email verification columns added successfully');
    } else {
      logger.info('✓ Users table email verification columns already exist');
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

    // ============ TASK 15: Superadmin System Control & Configuration ============

    // Check if permissions table exists (TASK15)
    const [permissionsTableResults] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'permissions';
    `);

    if (permissionsTableResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Creating permissions table (TASK15)...');
      
      await sequelize.query(`
        CREATE TABLE permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          \`key\` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Permission key e.g. complaints.view',
          label VARCHAR(255) NOT NULL COMMENT 'Human-readable label',
          module VARCHAR(100) NOT NULL COMMENT 'Module name: Dashboard, Residents, Requests, etc.',
          description TEXT NULL COMMENT 'Description of what this permission grants',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_module (\`module\`),
          INDEX idx_key (\`key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
        COMMENT='Stores all available system permissions';
      `);
      
      logger.info('✅ Migration completed: permissions table created');

      // Seed default permissions
      logger.info('📝 Seeding default permissions...');
      
      const defaultPermissions = [
        // Dashboard
        { key: 'dashboard.view', label: 'View Dashboard', module: 'Dashboard', description: 'Access to main dashboard' },
        { key: 'dashboard.analytics', label: 'View Analytics', module: 'Dashboard', description: 'View analytics and statistics' },
        { key: 'dashboard.reports', label: 'View Reports', module: 'Dashboard', description: 'Access reporting features' },
        
        // Residents
        { key: 'residents.view', label: 'View Residents', module: 'Residents', description: 'View resident list and profiles' },
        { key: 'residents.details', label: 'View Resident Details', module: 'Residents', description: 'View detailed resident information' },
        { key: 'residents.verify', label: 'Verify Residents', module: 'Residents', description: 'Verify resident accounts' },
        { key: 'residents.reject', label: 'Reject Residents', module: 'Residents', description: 'Reject resident verifications' },
        { key: 'residents.suspend', label: 'Suspend Residents', module: 'Residents', description: 'Suspend resident accounts' },
        { key: 'residents.delete', label: 'Delete Residents', module: 'Residents', description: 'Delete resident accounts' },
        
        // Requests
        { key: 'requests.view', label: 'View Requests', module: 'Requests', description: 'View document requests' },
        { key: 'requests.approve', label: 'Approve Requests', module: 'Requests', description: 'Approve document requests' },
        { key: 'requests.reject', label: 'Reject Requests', module: 'Requests', description: 'Reject document requests' },
        { key: 'requests.process', label: 'Process Requests', module: 'Requests', description: 'Process and update requests' },
        { key: 'requests.complete', label: 'Mark as Completed', module: 'Requests', description: 'Mark requests as completed' },
        { key: 'requests.download', label: 'Download Documents', module: 'Requests', description: 'Download request documents' },
        { key: 'requests.generate', label: 'Generate Documents', module: 'Requests', description: 'Generate official documents' },
        
        // Complaints
        { key: 'complaints.view', label: 'View Complaints', module: 'Complaints', description: 'View filed complaints' },
        { key: 'complaints.assign', label: 'Assign Complaints', module: 'Complaints', description: 'Assign complaints to staff' },
        { key: 'complaints.update', label: 'Update Complaint Status', module: 'Complaints', description: 'Update complaint status' },
        { key: 'complaints.resolve', label: 'Resolve Complaints', module: 'Complaints', description: 'Mark complaints as resolved' },
        
        // Announcements
        { key: 'announcements.view', label: 'View Announcements', module: 'Announcements', description: 'View all announcements' },
        { key: 'announcements.create', label: 'Create Announcements', module: 'Announcements', description: 'Create new announcements' },
        { key: 'announcements.edit', label: 'Edit Announcements', module: 'Announcements', description: 'Edit existing announcements' },
        { key: 'announcements.delete', label: 'Delete Announcements', module: 'Announcements', description: 'Delete announcements' },
        { key: 'announcements.publish', label: 'Publish Announcements', module: 'Announcements', description: 'Publish announcements' },
        
        // User Management
        { key: 'users.view', label: 'View Users', module: 'User Management', description: 'View admin user accounts' },
        { key: 'users.create', label: 'Create Users', module: 'User Management', description: 'Create new admin accounts' },
        { key: 'users.edit', label: 'Edit Users', module: 'User Management', description: 'Edit admin user accounts' },
        { key: 'users.deactivate', label: 'Deactivate Users', module: 'User Management', description: 'Deactivate admin accounts' },
        { key: 'users.reset', label: 'Reset User Access', module: 'User Management', description: 'Reset passwords and access' },
        
        // Reports
        { key: 'reports.view', label: 'View Reports', module: 'Reports', description: 'View system reports' },
        { key: 'reports.generate', label: 'Generate Reports', module: 'Reports', description: 'Generate custom reports' },
        { key: 'reports.export', label: 'Export Reports', module: 'Reports', description: 'Export reports to files' },
        
        // Logs
        { key: 'logs.view', label: 'View System Logs', module: 'System Logs', description: 'View audit and system logs' },
        { key: 'logs.export', label: 'Export Logs', module: 'System Logs', description: 'Export log files' }
      ];

      for (const perm of defaultPermissions) {
        await sequelize.query(`
          INSERT INTO permissions (\`key\`, label, module, description, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [perm.key, perm.label, perm.module, perm.description]
        });
      }

      logger.info(`✅ Seeded ${defaultPermissions.length} default permissions`);
    } else {
      logger.info('✓ Permissions table already exists (TASK15)');
      
      // Check if we need to seed data
      const [permCount] = await sequelize.query(`SELECT COUNT(*) as count FROM permissions`);
      if (permCount[0].count === 0) {
        logger.info('📝 Permissions table exists but is empty. Seeding default permissions...');
        
        try {
          const defaultPermissions = [
          // Dashboard
          { key: 'dashboard.view', label: 'View Dashboard', module: 'Dashboard', description: 'Access to main dashboard' },
          { key: 'dashboard.analytics', label: 'View Analytics', module: 'Dashboard', description: 'View analytics and statistics' },
          { key: 'dashboard.reports', label: 'View Reports', module: 'Dashboard', description: 'Access reporting features' },
          
          // Residents
          { key: 'residents.view', label: 'View Residents', module: 'Residents', description: 'View resident list and profiles' },
          { key: 'residents.details', label: 'View Resident Details', module: 'Residents', description: 'View detailed resident information' },
          { key: 'residents.verify', label: 'Verify Residents', module: 'Residents', description: 'Verify resident accounts' },
          { key: 'residents.reject', label: 'Reject Residents', module: 'Residents', description: 'Reject resident verifications' },
          { key: 'residents.suspend', label: 'Suspend Residents', module: 'Residents', description: 'Suspend resident accounts' },
          { key: 'residents.delete', label: 'Delete Residents', module: 'Residents', description: 'Delete resident accounts' },
          
          // Requests
          { key: 'requests.view', label: 'View Requests', module: 'Requests', description: 'View document requests' },
          { key: 'requests.approve', label: 'Approve Requests', module: 'Requests', description: 'Approve document requests' },
          { key: 'requests.reject', label: 'Reject Requests', module: 'Requests', description: 'Reject document requests' },
          { key: 'requests.process', label: 'Process Requests', module: 'Requests', description: 'Process and update requests' },
          { key: 'requests.complete', label: 'Mark as Completed', module: 'Requests', description: 'Mark requests as completed' },
          { key: 'requests.download', label: 'Download Documents', module: 'Requests', description: 'Download request documents' },
          { key: 'requests.generate', label: 'Generate Documents', module: 'Requests', description: 'Generate official documents' },
          
          // Complaints
          { key: 'complaints.view', label: 'View Complaints', module: 'Complaints', description: 'View filed complaints' },
          { key: 'complaints.assign', label: 'Assign Complaints', module: 'Complaints', description: 'Assign complaints to staff' },
          { key: 'complaints.update', label: 'Update Complaint Status', module: 'Complaints', description: 'Update complaint status' },
          { key: 'complaints.resolve', label: 'Resolve Complaints', module: 'Complaints', description: 'Mark complaints as resolved' },
          
          // Announcements
          { key: 'announcements.view', label: 'View Announcements', module: 'Announcements', description: 'View all announcements' },
          { key: 'announcements.create', label: 'Create Announcements', module: 'Announcements', description: 'Create new announcements' },
          { key: 'announcements.edit', label: 'Edit Announcements', module: 'Announcements', description: 'Edit existing announcements' },
          { key: 'announcements.delete', label: 'Delete Announcements', module: 'Announcements', description: 'Delete announcements' },
          { key: 'announcements.publish', label: 'Publish Announcements', module: 'Announcements', description: 'Publish announcements' },
          
          // User Management
          { key: 'users.view', label: 'View Users', module: 'User Management', description: 'View admin user accounts' },
          { key: 'users.create', label: 'Create Users', module: 'User Management', description: 'Create new admin accounts' },
          { key: 'users.edit', label: 'Edit Users', module: 'User Management', description: 'Edit admin user accounts' },
          { key: 'users.deactivate', label: 'Deactivate Users', module: 'User Management', description: 'Deactivate admin accounts' },
          { key: 'users.reset', label: 'Reset User Access', module: 'User Management', description: 'Reset passwords and access' },
          
          // Reports
          { key: 'reports.view', label: 'View Reports', module: 'Reports', description: 'View system reports' },
          { key: 'reports.generate', label: 'Generate Reports', module: 'Reports', description: 'Generate custom reports' },
          { key: 'reports.export', label: 'Export Reports', module: 'Reports', description: 'Export reports to files' },
          
          // Logs
          { key: 'logs.view', label: 'View System Logs', module: 'System Logs', description: 'View audit and system logs' },
          { key: 'logs.export', label: 'Export Logs', module: 'System Logs', description: 'Export log files' }
        ];

        for (const perm of defaultPermissions) {
          await sequelize.query(`
            INSERT INTO permissions (\`key\`, label, module, description, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, NOW(), NOW())
          `, {
            replacements: [perm.key, perm.label, perm.module, perm.description]
          });
        }

        logger.info(`✅ Seeded ${defaultPermissions.length} default permissions`);
        } catch (seedError) {
          console.error('❌ Error seeding permissions:',  seedError);
          logger.error('❌ Error seeding permissions:', seedError?.message || String(seedError));
          logger.error('SQL Error:', seedError?.sql);
          throw seedError; // Re-throw to trigger main error handler
        }
      } else {
        logger.info(`✓ Permissions table has ${permCount[0].count} entries`);
      }
    }

    // Check if role_permissions table exists (TASK15)
    const [rolePermissionsTableResults] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'role_permissions';
    `);

    if (rolePermissionsTableResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Creating role_permissions table (TASK15)...');
      
      await sequelize.query(`
        CREATE TABLE role_permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          role ENUM('captain', 'secretary', 'staff') NOT NULL COMMENT 'Admin role type',
          permissionKey VARCHAR(100) NOT NULL COMMENT 'References permissions.key',
          granted BOOLEAN DEFAULT TRUE NOT NULL COMMENT 'Whether permission is granted',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_role_permission (role, permissionKey),
          INDEX idx_role (role),
          INDEX idx_permission (permissionKey)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
        COMMENT='Maps permissions to roles';
      `);
      
      logger.info('✅ Migration completed: role_permissions table created');

      // Seed default role permissions based on current system behavior
      logger.info('📝 Seeding default role permissions...');

      const rolePermissions = {
        captain: [
          'dashboard.view', 'dashboard.analytics', 'dashboard.reports',
          'residents.view', 'residents.details', 'residents.verify', 'residents.reject', 'residents.suspend',
          'requests.view', 'requests.approve', 'requests.reject', 'requests.process', 'requests.complete', 'requests.download', 'requests.generate',
          'complaints.view', 'complaints.assign', 'complaints.update', 'complaints.resolve',
          'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete', 'announcements.publish',
          'users.view', 'users.create', 'users.edit', 'users.deactivate',
          'reports.view', 'reports.generate', 'reports.export',
          'logs.view', 'logs.export'
        ],
        secretary: [
          'dashboard.view', 'dashboard.analytics',
          'residents.view', 'residents.details', 'residents.verify', 'residents.reject',
          'requests.view', 'requests.approve', 'requests.reject', 'requests.process', 'requests.complete', 'requests.download', 'requests.generate',
          'complaints.view', 'complaints.assign', 'complaints.update',
          'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.publish',
          'users.view',
          'reports.view', 'reports.generate'
        ],
        staff: [
          'dashboard.view',
          'residents.view', 'residents.details',
          'requests.view', 'requests.process', 'requests.download',
          'complaints.view', 'complaints.update',
          'announcements.view',
          'reports.view'
        ]
      };

      for (const [role, permissions] of Object.entries(rolePermissions)) {
        for (const permKey of permissions) {
          await sequelize.query(`
            INSERT INTO role_permissions (role, permissionKey, granted, createdAt, updatedAt)
            VALUES (?, ?, TRUE, NOW(), NOW())
          `, {
            replacements: [role, permKey]
          });
        }
      }

      logger.info('✅ Seeded default role permissions for captain, secretary, and staff');
    } else {
      logger.info('✓ Role_permissions table already exists (TASK15)');
      
      // Check if we need to seed data
      const [rolePermCount] = await sequelize.query(`SELECT COUNT(*) as count FROM role_permissions`);
      if (rolePermCount[0].count === 0) {
        logger.info('📝 Role_permissions table exists but is empty. Seeding default role permissions...');
        
        const rolePermissions = {
          captain: [
            'dashboard.view', 'dashboard.analytics', 'dashboard.reports',
            'residents.view', 'residents.details', 'residents.verify', 'residents.reject', 'residents.suspend',
            'requests.view', 'requests.approve', 'requests.reject', 'requests.process', 'requests.complete', 'requests.download', 'requests.generate',
            'complaints.view', 'complaints.assign', 'complaints.update', 'complaints.resolve',
            'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete', 'announcements.publish',
            'users.view', 'users.create', 'users.edit', 'users.deactivate',
            'reports.view', 'reports.generate', 'reports.export',
            'logs.view', 'logs.export'
          ],
          secretary: [
            'dashboard.view', 'dashboard.analytics',
            'residents.view', 'residents.details', 'residents.verify', 'residents.reject',
            'requests.view', 'requests.approve', 'requests.reject', 'requests.process', 'requests.complete', 'requests.download', 'requests.generate',
            'complaints.view', 'complaints.assign', 'complaints.update',
            'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.publish',
            'users.view',
            'reports.view', 'reports.generate'
          ],
          staff: [
            'dashboard.view',
            'residents.view', 'residents.details',
            'requests.view', 'requests.process', 'requests.download',
            'complaints.view', 'complaints.update',
            'announcements.view',
            'reports.view'
          ]
        };

        for (const [role, permissions] of Object.entries(rolePermissions)) {
          for (const permKey of permissions) {
            await sequelize.query(`
              INSERT INTO role_permissions (role, permissionKey, granted, createdAt, updatedAt)
              VALUES (?, ?, TRUE, NOW(), NOW())
            `, {
              replacements: [role, permKey]
            });
          }
        }

        logger.info('✅ Seeded default role permissions for captain, secretary, and staff');
      } else {
        logger.info(`✓ Role_permissions table has ${rolePermCount[0].count} entries`);
      }
    }

    // Check if DocumentServices table exists (TASK15)
    const [docServicesTableResults] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'DocumentServices';
    `);

    if (docServicesTableResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Creating DocumentServices table (TASK15)...');
      
      await sequelize.query(`
        CREATE TABLE DocumentServices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Document/service name',
          description TEXT NULL COMMENT 'Description of the document/service',
          category VARCHAR(100) NULL COMMENT 'Category grouping',
          processingFee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Fee in pesos',
          isFree BOOLEAN DEFAULT FALSE COMMENT 'Whether document is free',
          processingDays INT DEFAULT 3 COMMENT 'Standard processing time in days',
          isAvailable BOOLEAN DEFAULT TRUE COMMENT 'Whether service is currently available',
          allowOnlineRequest BOOLEAN DEFAULT TRUE COMMENT 'Can be requested online',
          requiresVerification BOOLEAN DEFAULT TRUE COMMENT 'Requires verification step',
          requiresApproval BOOLEAN DEFAULT TRUE COMMENT 'Requires admin approval',
          priority INT DEFAULT 100 COMMENT 'Sort order priority',
          maxRequests INT NULL COMMENT 'Max requests per resident (if applicable)',
          notes TEXT NULL COMMENT 'Additional notes or requirements',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_category (category),
          INDEX idx_available (isAvailable),
          INDEX idx_priority (priority)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
        COMMENT='Dynamic document and service configuration';
      `);
      
      logger.info('✅ Migration completed: DocumentServices table created');

      // Seed default document services based on current system
      logger.info('📝 Seeding default document services...');

      const defaultServices = [
        { name: 'Barangay Clearance', description: 'Barangay clearance certificate for various purposes', category: 'Certificates', processingFee: 50.00, processingDays: 2, priority: 1 },
        { name: 'Certificate of Residency', description: 'Certificate proving residency in the barangay', category: 'Certificates', processingFee: 30.00, processingDays: 1, priority: 2 },
        { name: 'Certificate of Indigency', description: 'Certificate for indigent residents', category: 'Certificates', processingFee: 0.00, isFree: true, processingDays: 2, priority: 3 },
        { name: 'Business Clearance', description: 'Clearance for business permit application', category: 'Business', processingFee: 100.00, processingDays: 3, priority: 4 },
        { name: 'Barangay ID', description: 'Official barangay identification card', category: 'ID', processingFee: 50.00, processingDays: 5, priority: 5 },
        { name: 'Community Tax Certificate (Cedula)', description: 'Community tax certificate', category: 'Certificates', processingFee: 20.00, processingDays: 1, priority: 6 },
        { name: 'Certificate of Good Moral Character', description: 'Character certificate for employment or school', category: 'Certificates', processingFee: 30.00, processingDays: 2, priority: 7 },
        { name: 'Travel Permit', description: 'Permit for travel purposes (if required)', category: 'Permits', processingFee: 0.00, isFree: true, processingDays: 1, priority: 8 },
        { name: 'Guardianship Certificate', description: 'Certificate of guardianship', category: 'Certificates', processingFee: 50.00, processingDays: 3, priority: 9 },
        { name: 'First Time Job Seeker Certificate', description: 'Certificate for first-time job seekers', category: 'Certificates', processingFee: 0.00, isFree: true, processingDays: 1, priority: 10 }
      ];

      for (const service of defaultServices) {
        await sequelize.query(`
          INSERT INTO DocumentServices (name, description, category, processingFee, isFree, processingDays, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [service.name, service.description, service.category, service.processingFee, service.isFree, service.processingDays, service.priority]
        });
      }

      logger.info(`✅ Seeded ${defaultServices.length} default document services`);
    } else {
      logger.info('✓ DocumentServices table already exists (TASK15)');
    }

    // Check if system_settings table exists (TASK15)
    const [systemSettingsTableResults] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'system_settings';
    `);

    if (systemSettingsTableResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Creating system_settings table (TASK15)...');
      
      await sequelize.query(`
        CREATE TABLE system_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          \`key\` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Setting key identifier',
          value TEXT NULL COMMENT 'Setting value (can be JSON)',
          type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT 'Value data type',
          label VARCHAR(255) NOT NULL COMMENT 'Human-readable label',
          description TEXT NULL COMMENT 'Description of setting',
          category VARCHAR(100) NOT NULL COMMENT 'barangay, request, security, notification, resident',
          updatedBy INT NULL COMMENT 'User ID who last updated',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_category (category),
          INDEX idx_key (\`key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
        COMMENT='System-wide configuration settings';
      `);
      
      logger.info('✅ Migration completed: system_settings table created');

      // Seed default system settings
      logger.info('📝 Seeding default system settings...');

      const defaultSettings = [
        // Barangay Information
        { key: 'barangay_name', value: 'Barangay Bakilid', type: 'string', label: 'Barangay Name', category: 'barangay', description: 'Official barangay name' },
        { key: 'municipality', value: 'Mandaue City', type: 'string', label: 'Municipality/City', category: 'barangay', description: 'Municipality or city' },
        { key: 'province', value: 'Cebu', type: 'string', label: 'Province', category: 'barangay', description: 'Province name' },
        { key: 'barangay_email', value: 'barangaybakilid@mandaue.gov.ph', type: 'string', label: 'Official Email', category: 'barangay', description: 'Official contact email' },
        { key: 'barangay_contact', value: '(032) 123-4567', type: 'string', label: 'Contact Number', category: 'barangay', description: 'Official contact number' },
        { key: 'office_address', value: 'Bakilid, Mandaue City, Cebu', type: 'string', label: 'Office Address', category: 'barangay', description: 'Physical office address' },
        { key: 'office_hours', value: 'Monday - Friday, 8:00 AM - 5:00 PM', type: 'string', label: 'Office Hours', category: 'barangay', description: 'Operating hours' },
        
        // Request Settings
        { key: 'default_processing_days', value: '3', type: 'number', label: 'Default Processing Days', category: 'request', description: 'Default processing time for requests' },
        { key: 'max_pending_requests', value: '5', type: 'number', label: 'Max Pending Requests', category: 'request', description: 'Maximum pending requests per resident' },
        { key: 'request_expiration_days', value: '30', type: 'number', label: 'Request Expiration (Days)', category: 'request', description: 'Days before unclaimed requests expire' },
        { key: 'allow_request_cancellation', value: 'true', type: 'boolean', label: 'Allow Request Cancellation', category: 'request', description: 'Residents can cancel pending requests' },
        
        // Resident Account Settings
        { key: 'registration_enabled', value: 'true', type: 'boolean', label: 'Registration Enabled', category: 'resident', description: 'Allow new resident registration' },
        { key: 'account_verification_required', value: 'true', type: 'boolean', label: 'Account Verification Required', category: 'resident', description: 'New accounts require admin verification' },
        { key: 'pending_account_expiration_days', value: '30', type: 'number', label: 'Pending Account Expiration', category: 'resident', description: 'Days before unverified accounts expire' },
        { key: 'min_password_length', value: '8', type: 'number', label: 'Minimum Password Length', category: 'resident', description: 'Minimum characters for passwords' },
        { key: 'session_timeout_minutes', value: '60', type: 'number', label: 'Session Timeout (Minutes)', category: 'resident', description: 'Auto-logout after inactivity' },
        
        // Notification Settings
        { key: 'email_notifications_enabled', value: 'true', type: 'boolean', label: 'Email Notifications', category: 'notification', description: 'Send email notifications' },
        { key: 'notify_on_request_status', value: 'true', type: 'boolean', label: 'Request Status Notifications', category: 'notification', description: 'Notify residents on request status changes' },
        { key: 'notify_on_new_announcement', value: 'true', type: 'boolean', label: 'New Announcement Notifications', category: 'notification', description: 'Notify residents of new announcements' },
        
        // Security Settings
        { key: 'max_login_attempts', value: '5', type: 'number', label: 'Max Login Attempts', category: 'security', description: 'Failed attempts before account lockout' },
        { key: 'account_lockout_minutes', value: '15', type: 'number', label: 'Account Lockout Duration', category: 'security', description: 'Minutes account is locked after max attempts' },
        { key: 'require_captcha', value: 'true', type: 'boolean', label: 'Require CAPTCHA', category: 'security', description: 'Require CAPTCHA on login and registration' },
        { key: 'rate_limit_per_minute', value: '100', type: 'number', label: 'API Rate Limit', category: 'security', description: 'Max API requests per minute per IP' }
      ];

      for (const setting of defaultSettings) {
        await sequelize.query(`
          INSERT INTO system_settings (\`key\`, value, type, label, category, description, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [setting.key, setting.value, setting.type, setting.label, setting.category, setting.description]
        });
      }

      logger.info(`✅ Seeded ${defaultSettings.length} default system settings`);
    } else {
      logger.info('✓ System_settings table already exists (TASK15)');
      
      // Check if table is empty and seed if needed
      const [settingsCount] = await sequelize.query(`SELECT COUNT(*) as count FROM system_settings`);
      if (settingsCount[0].count === 0) {
        logger.info('📝 System_settings table exists but is empty. Seeding default settings...');
        
        const defaultSettings = [
          { key: 'system_name', value: 'Barangay Management System', type: 'string', label: 'System Name', category: 'general', description: 'Official name of the system' },
          { key: 'barangay_name', value: 'Barangay Bakilid', type: 'string', label: 'Barangay Name', category: 'general', description: 'Official barangay name' },
          { key: 'contact_email', value: 'barangay@example.com', type: 'string', label: 'Contact Email', category: 'contact', description: 'Primary contact email' },
          { key: 'contact_phone', value: '+63 XXX XXX XXXX', type: 'string', label: 'Contact Phone', category: 'contact', description: 'Primary contact phone number' },
          { key: 'office_hours', value: 'Mon-Fri 8:00 AM - 5:00 PM', type: 'string', label: 'Office Hours', category: 'general', description: 'Barangay office operating hours' },
          { key: 'maintenance_mode', value: 'false', type: 'boolean', label: 'Maintenance Mode', category: 'system', description: 'Enable to put system under maintenance' },
          { key: 'allow_registrations', value: 'true', type: 'boolean', label: 'Allow Registrations', category: 'system', description: 'Allow new resident registrations' },
          { key: 'require_email_verification', value: 'false', type: 'boolean', label: 'Require Email Verification', category: 'security', description: 'Require email verification for new accounts' },
          { key: 'session_timeout', value: '3600', type: 'number', label: 'Session Timeout (seconds)', category: 'security', description: 'User session timeout duration' },
          { key: 'max_login_attempts', value: '5', type: 'number', label: 'Max Login Attempts', category: 'security', description: 'Maximum failed login attempts before lockout' }
        ];
        
        for (const setting of defaultSettings) {
          await sequelize.query(`
            INSERT INTO system_settings (\`key\`, value, type, label, category, description, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, {
            replacements: [setting.key, setting.value, setting.type, setting.label, setting.category, setting.description]
          });
        }
        
        logger.info(`✅ Seeded ${defaultSettings.length} default system settings into empty table`);
      }
    }

    // Check if feature_flags table exists (TASK15)
    const [featureFlagsTableResults] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'feature_flags';
    `);

    if (featureFlagsTableResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Creating feature_flags table (TASK15)...');
      
      await sequelize.query(`
        CREATE TABLE feature_flags (
          id INT AUTO_INCREMENT PRIMARY KEY,
          \`key\` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Feature key identifier',
          label VARCHAR(255) NOT NULL COMMENT 'Human-readable feature name',
          description TEXT NULL COMMENT 'Feature description',
          isEnabled BOOLEAN DEFAULT TRUE NOT NULL COMMENT 'Whether feature is enabled',
          updatedBy INT NULL COMMENT 'User ID who last updated',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_key (\`key\`),
          INDEX idx_enabled (isEnabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
        COMMENT='System feature toggles';
      `);
      
      logger.info('✅ Migration completed: feature_flags table created');

      // Seed default feature flags
      logger.info('📝 Seeding default feature flags...');

      const defaultFeatures = [
        { key: 'online_requests', label: 'Online Document Requests', description: 'Allow residents to request documents online', isEnabled: true },
        { key: 'complaints_module', label: 'Complaints System', description: 'Enable complaint filing and management', isEnabled: true },
        { key: 'announcements_module', label: 'Announcements', description: 'Enable barangay announcements and news', isEnabled: true },
        { key: 'resident_verification', label: 'Resident Verification', description: 'Require admin verification for new accounts', isEnabled: true },
        { key: 'notifications', label: 'Notifications System', description: 'Real-time notifications for users', isEnabled: true },
        { key: 'reports_analytics', label: 'Reports & Analytics', description: 'Advanced reporting and analytics dashboards', isEnabled: true },
        { key: 'online_payments', label: 'Online Payments', description: 'Online payment processing for fees', isEnabled: false },
        { key: 'digital_delivery', label: 'Digital Document Delivery', description: 'Digital delivery of approved documents', isEnabled: false },
        { key: 'mobile_app', label: 'Mobile App Integration', description: 'Mobile app API and features', isEnabled: false }
      ];

      for (const feature of defaultFeatures) {
        await sequelize.query(`
          INSERT INTO feature_flags (\`key\`, label, description, isEnabled, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [feature.key, feature.label, feature.description, feature.isEnabled]
        });
      }

      logger.info(`✅ Seeded ${defaultFeatures.length} default feature flags`);
    } else {
      logger.info('✓ Feature_flags table already exists (TASK15)');
      
      // Check if table is empty and seed if needed
      const [featuresCount] = await sequelize.query(`SELECT COUNT(*) as count FROM feature_flags`);
      if (featuresCount[0].count === 0) {
        logger.info('📝 Feature_flags table exists but is empty. Seeding default features...');
        
        const defaultFeatures = [
          { key: 'online_requests', label: 'Online Document Requests', description: 'Allow residents to request documents online', isEnabled: true },
          { key: 'complaints_module', label: 'Complaints System', description: 'Enable complaint filing and management', isEnabled: true },
          { key: 'announcements_module', label: 'Announcements', description: 'Enable barangay announcements and news', isEnabled: true },
          { key: 'resident_verification', label: 'Resident Verification', description: 'Require admin verification for new accounts', isEnabled: true },
          { key: 'notifications', label: 'Notifications System', description: 'Real-time notifications for users', isEnabled: true },
          { key: 'reports_analytics', label: 'Reports & Analytics', description: 'Advanced reporting and analytics dashboards', isEnabled: true },
          { key: 'online_payments', label: 'Online Payments', description: 'Online payment processing for fees', isEnabled: false },
          { key: 'digital_delivery', label: 'Digital Document Delivery', description: 'Digital delivery of approved documents', isEnabled: false },
          { key: 'mobile_app', label: 'Mobile App Integration', description: 'Mobile app API and features', isEnabled: false }
        ];
        
        for (const feature of defaultFeatures) {
          await sequelize.query(`
            INSERT INTO feature_flags (\`key\`, label, description, isEnabled, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, NOW(), NOW())
          `, {
            replacements: [feature.key, feature.label, feature.description, feature.isEnabled]
          });
        }
        
        logger.info(`✅ Seeded ${defaultFeatures.length} default feature flags into empty table`);
      }
    }

    // Check if audit_logs table exists (TASK15)
    const [auditLogsTableResults] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'audit_logs';
    `);

    if (auditLogsTableResults.length === 0) {
      logger.info('⚙️ Running automatic migration: Creating audit_logs table (TASK15)...');
      
      await sequelize.query(`
        CREATE TABLE audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NULL COMMENT 'User who performed the action',
          userRole VARCHAR(50) NULL COMMENT 'Role of the user at the time',
          action VARCHAR(255) NOT NULL COMMENT 'Action performed e.g. LOGIN, UPDATE_PERMISSION',
          module VARCHAR(100) NOT NULL COMMENT 'Module/section affected',
          targetId INT NULL COMMENT 'ID of affected entity',
          targetType VARCHAR(100) NULL COMMENT 'Type of affected entity',
          description TEXT NULL COMMENT 'Human-readable description',
          oldValue JSON NULL COMMENT 'Previous value (if applicable)',
          newValue JSON NULL COMMENT 'New value (if applicable)',
          ipAddress VARCHAR(45) NULL COMMENT 'IP address of requester',
          status VARCHAR(50) DEFAULT 'success' COMMENT 'success, failure, error',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user (userId),
          INDEX idx_action (action),
          INDEX idx_module (module),
          INDEX idx_created (createdAt),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
        COMMENT='Comprehensive audit trail for security and compliance';
      `);
      
      logger.info('✅ Migration completed: audit_logs table created');
      logger.info('🔐 TASK15: Superadmin system control is now active');
      logger.info('   - Dynamic permissions and roles');
      logger.info('   - Configurable document services');
      logger.info('   - System settings management');
      logger.info('   - Feature flags');
      logger.info('   - Comprehensive audit logging');
    } else {
      logger.info('✓ Audit_logs table already exists (TASK15)');
    }

    // ============ NEW: Request Model Update - DocumentServiceId Migration ============
    
    // Check if DocumentServiceId column exists in Requests table
    const [docServiceIdCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Requests' 
        AND COLUMN_NAME = 'DocumentServiceId';
    `);

    if (docServiceIdCheck.length === 0) {
      logger.info('⚙️ Running automatic migration: Updating Requests table to use DocumentServiceId...');
      
      // Step 1: Add DocumentServiceId column
      await sequelize.query(`
        ALTER TABLE Requests
        ADD COLUMN DocumentServiceId INT NULL AFTER id
      `);
      logger.info('✅ Added DocumentServiceId column');
      
      // Step 2: Convert documentType from ENUM to VARCHAR(255)
      await sequelize.query(`
        ALTER TABLE Requests
        MODIFY COLUMN documentType VARCHAR(255) NULL
      `);
      logger.info('✅ Converted documentType to VARCHAR(255)');
      
      // Step 3: Add new tracking fields
      const trackingFields = [
        { name: 'requestedDate', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
        { name: 'processedBy', type: 'INT', default: 'NULL' },
        { name: 'processingFee', type: 'DECIMAL(10,2)', default: '0.00' },
        { name: 'paymentStatus', type: "ENUM('Unpaid','Paid','Waived')", default: "'Unpaid'" },
      ];

      for (const field of trackingFields) {
        const [fieldCheck] = await sequelize.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'Requests' 
            AND COLUMN_NAME = '${field.name}'
        `);

        if (fieldCheck.length === 0) {
          await sequelize.query(`
            ALTER TABLE Requests
            ADD COLUMN ${field.name} ${field.type} DEFAULT ${field.default}
          `);
          logger.info(`✅ Added ${field.name} column`);
        }
      }
      
      // Step 4: Migrate existing data - map old documentType to DocumentServiceId
      logger.info('📝 Migrating existing request data...');
      
      const documentTypeMapping = [
        { oldName: 'Barangay Clearance', newName: 'Barangay Clearance' },
        { oldName: 'Certificate of Residency', newName: 'Certificate of Residency' },
        { oldName: 'Indigency Certificate', newName: 'Certificate of Indigency' },
        { oldName: 'Business Permit', newName: 'Business Clearance' },
        { oldName: 'Certificate of Good Moral', newName: 'Certificate of Good Moral Character' },
        { oldName: 'Community Tax Certificate (Cedula)', newName: 'Community Tax Certificate (Cedula)' },
      ];

      for (const mapping of documentTypeMapping) {
        const [service] = await sequelize.query(`
          SELECT id FROM DocumentServices WHERE name = ?
        `, { replacements: [mapping.newName] });

        if (service.length > 0) {
          const serviceId = service[0].id;
          await sequelize.query(`
            UPDATE Requests
            SET DocumentServiceId = ?
            WHERE documentType = ? AND DocumentServiceId IS NULL
          `, { replacements: [serviceId, mapping.oldName] });
          
          logger.info(`   ✓ Migrated "${mapping.oldName}" → DocumentServiceId: ${serviceId}`);
        }
      }
      
      // Step 5: Delete any requests without mapped DocumentServiceId
      const [nullCountResult] = await sequelize.query(`
        SELECT COUNT(*) as count FROM Requests WHERE DocumentServiceId IS NULL
      `);
      
      if (nullCountResult[0].count > 0) {
        logger.info(`⚠️  Deleting ${nullCountResult[0].count} requests without mapped services...`);
        await sequelize.query(`DELETE FROM Requests WHERE DocumentServiceId IS NULL`);
      }
      
      // Step 6: Make DocumentServiceId NOT NULL
      await sequelize.query(`
        ALTER TABLE Requests
        MODIFY COLUMN DocumentServiceId INT NOT NULL
      `);
      logger.info('✅ Made DocumentServiceId required');
      
      // Step 7: Add foreign key constraint
      try {
        await sequelize.query(`
          ALTER TABLE Requests
          ADD CONSTRAINT fk_requests_document_service
          FOREIGN KEY (DocumentServiceId) REFERENCES DocumentServices(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
        `);
        logger.info('✅ Added foreign key constraint');
      } catch (error) {
        if (error.message && error.message.includes('Duplicate')) {
          logger.info('⏭️  Foreign key constraint already exists');
        } else {
          throw error;
        }
      }
      
      logger.info('✅ Request model migration completed successfully');
      logger.info('📄 Requests now use dynamic DocumentServices instead of hardcoded ENUMs');
      logger.info('🎯 Benefits:');
      logger.info('   - Superadmin can add/edit document services dynamically');
      logger.info('   - Residents see all available services automatically');
      logger.info('   - Support for processing fees, free documents, and custom settings');
    } else {
      logger.info('✓ Requests table already updated with DocumentServiceId');
    }

  } catch (error) {
    console.error('❌ Auto-migration error:');
    console.error('Error message:', error?.message || 'No message');
    console.error('Error name:', error?.name || 'No name');
    console.error('Error code:', error?.code || 'No code');
    console.error('Stack trace:', error?.stack || 'No stack trace');
    
    // Try to log the error in different ways
    try {
      logger.error('❌ Auto-migration error:', error?.message || String(error));
      logger.error('Stack trace:', error?.stack || 'No stack trace available');
      logger.error('Error details:', { 
        name: error?.name, 
        code: error?.code,
        sqlMessage: error?.sqlMessage,
        sql: error?.sql 
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    // Don't crash the server, just log the error
  }
}
