import sequelize from '../config/db.js';

/**
 * Add image variant columns to announcements table
 * Run this to add thumbnailUrl, mediumUrl, largeUrl columns
 */
async function addImageVariantColumns() {
    try {
        console.log('🔄 Adding image variant columns to announcements table...');

        // Check and add thumbnailUrl column
        try {
            await sequelize.query(`
                ALTER TABLE Announcements 
                ADD COLUMN thumbnailUrl VARCHAR(255) AFTER imagePath
            `);
            console.log('✅ Added thumbnailUrl column');
        } catch (err) {
            if (err.original?.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  thumbnailUrl column already exists');
            } else {
                throw err;
            }
        }

        // Check and add mediumUrl column
        try {
            await sequelize.query(`
                ALTER TABLE Announcements 
                ADD COLUMN mediumUrl VARCHAR(255) AFTER thumbnailUrl
            `);
            console.log('✅ Added mediumUrl column');
        } catch (err) {
            if (err.original?.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  mediumUrl column already exists');
            } else {
                throw err;
            }
        }

        // Check and add largeUrl column
        try {
            await sequelize.query(`
                ALTER TABLE Announcements 
                ADD COLUMN largeUrl VARCHAR(255) AFTER mediumUrl
            `);
            console.log('✅ Added largeUrl column');
        } catch (err) {
            if (err.original?.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  largeUrl column already exists');
            } else {
                throw err;
            }
        }

        console.log('✅ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addImageVariantColumns();
