import sequelize from '../config/db.js';

async function updateAnnouncementCategory() {
    try {
        console.log('🔄 Updating announcement category field...\n');

        // Modify the category enum to match UI tabs
        await sequelize.query(`
            ALTER TABLE Announcements 
            MODIFY COLUMN category 
            ENUM('General', 'Emergency', 'Important', 'Events', 'Advisories') 
            DEFAULT 'General'
        `);

        console.log('✅ Category field updated successfully');
        console.log('   New values: General, Emergency, Important, Events, Advisories\n');

        // Update existing announcements - map old categories to new ones
        const updates = [
            { old: 'Event', new: 'Events' },
            { old: 'Advisory', new: 'Advisories' },
            { old: 'Community', new: 'General' },
        ];

        for (const { old, new: newVal } of updates) {
            const [results] = await sequelize.query(`
                UPDATE Announcements 
                SET category = '${newVal}' 
                WHERE category = '${old}'
            `);
            if (results.affectedRows > 0) {
                console.log(`✅ Updated ${results.affectedRows} announcement(s): ${old} → ${newVal}`);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

updateAnnouncementCategory();
