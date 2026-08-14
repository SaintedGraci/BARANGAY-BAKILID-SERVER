import sequelize from './config/db.js';
import logger from './config/logger.js';
import { DataTypes } from 'sequelize';

console.log('🔄 Starting Announcement Fields Migration...\n');

async function runMigration() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    // Get current table structure
    const tableDescription = await queryInterface.describeTable('Announcements');
    
    console.log('\n📋 Current Announcements table columns:');
    Object.keys(tableDescription).forEach(column => {
      console.log(`   - ${column}`);
    });

    // Add isPinned column if it doesn't exist
    if (!tableDescription.isPinned) {
      console.log('\n🔧 Adding isPinned column...');
      await queryInterface.addColumn('Announcements', 'isPinned', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      logger.info('✅ isPinned column added successfully');
    } else {
      logger.info('ℹ️  isPinned column already exists');
    }

    // Add category column if it doesn't exist
    if (!tableDescription.category) {
      console.log('🔧 Adding category column...');
      await queryInterface.addColumn('Announcements', 'category', {
        type: DataTypes.ENUM("General", "Event", "Advisory", "Emergency", "Community"),
        defaultValue: "General",
        allowNull: true,
      });
      logger.info('✅ category column added successfully');
    } else {
      logger.info('ℹ️  category column already exists');
    }

    // Verify the changes
    const updatedTableDescription = await queryInterface.describeTable('Announcements');
    
    console.log('\n📋 Updated Announcements table columns:');
    Object.keys(updatedTableDescription).forEach(column => {
      console.log(`   - ${column}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Start the backend: npm start');
    console.log('  2. Start the frontend: cd ../barangay_client && npm run dev');
    console.log('  3. Test the new announcement feed\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration();
