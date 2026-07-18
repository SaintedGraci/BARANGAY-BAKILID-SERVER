import sequelize from './config/db.js';
import Announcement from './models/announcement.js';

async function testAnnouncements() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const announcements = await Announcement.findAll({
      attributes: ['id', 'title', 'imagePath', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    console.log('\n=== Announcements in Database ===');
    console.log(JSON.stringify(announcements, null, 2));
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAnnouncements();
