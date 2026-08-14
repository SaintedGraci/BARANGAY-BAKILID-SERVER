import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';
import logger from '../config/logger.js';

async function addAnnouncementFields() {
  try {
    const queryInterface = sequelize.getQueryInterface();

    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('Announcements');

    // Add isPinned column if it doesn't exist
    if (!tableDescription.isPinned) {
      await queryInterface.addColumn('Announcements', 'isPinned', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      logger.info('✅ Added isPinned column to Announcements table');
    } else {
      logger.info('ℹ️  isPinned column already exists');
    }

    // Add category column if it doesn't exist
    if (!tableDescription.category) {
      await queryInterface.addColumn('Announcements', 'category', {
        type: DataTypes.ENUM("General", "Event", "Advisory", "Emergency", "Community"),
        defaultValue: "General",
        allowNull: false,
      });
      logger.info('✅ Added category column to Announcements table');
    } else {
      logger.info('ℹ️  category column already exists');
    }

    logger.info('✅ Announcement fields migration completed successfully');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addAnnouncementFields()
    .then(() => {
      logger.info('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

export default addAnnouncementFields;
