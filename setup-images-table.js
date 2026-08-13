import sequelize from './config/db.js';
import Image from './models/image.js';
import logger from './config/logger.js';

/**
 * Setup script to create the images table
 * Run: node setup-images-table.js
 */
async function setupImagesTable() {
    try {
        logger.info('🔄 Starting images table setup...');

        // Test database connection
        await sequelize.authenticate();
        logger.info('✅ Database connection established');

        // Create/update images table
        await Image.sync({ alter: true });
        logger.info('✅ Images table created/updated successfully');

        // Verify table exists
        const [results] = await sequelize.query("SHOW TABLES LIKE 'images'");
        if (results.length > 0) {
            logger.info('✅ Images table verified in database');

            // Show table structure
            const [columns] = await sequelize.query("DESCRIBE images");
            logger.info('📋 Table structure:');
            columns.forEach(col => {
                logger.info(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
        } else {
            logger.error('❌ Images table not found after creation');
        }

        logger.info('✅ Setup complete!');
        process.exit(0);

    } catch (error) {
        logger.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

// Run setup
setupImagesTable();
