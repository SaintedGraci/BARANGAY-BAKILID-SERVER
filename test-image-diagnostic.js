import Image from './models/image.js';
import Announcement from './models/announcement.js';
import Resident from './models/resident.js';
import sequelize from './config/db.js';

async function runDiagnostic() {
    try {
        console.log('🔍 IMAGE DIAGNOSTIC TEST\n');
        console.log('=' .repeat(60));

        // 1. Check images table
        console.log('\n📊 Images Table Status:');
        const images = await Image.findAll({ limit: 10 });
        console.log(`   Total images: ${images.length}`);
        if (images.length > 0) {
            console.log('   Sample images:');
            images.forEach(img => {
                console.log(`   - ID: ${img.id}, Category: ${img.category}, URL: ${img.url}`);
            });
        } else {
            console.log('   ⚠️  Images table is EMPTY');
        }

        // 2. Check announcements
        console.log('\n📢 Announcements:');
        const announcements = await Announcement.findAll({
            attributes: ['id', 'title', 'imagePath', 'thumbnailUrl', 'mediumUrl', 'largeUrl'],
            limit: 5
        });
        console.log(`   Total announcements: ${announcements.length}`);
        announcements.forEach(ann => {
            console.log(`   - ID: ${ann.id}, Title: ${ann.title}`);
            console.log(`     imagePath: ${ann.imagePath || 'NULL'}`);
            console.log(`     thumbnailUrl: ${ann.thumbnailUrl || 'NULL'}`);
            console.log(`     mediumUrl: ${ann.mediumUrl || 'NULL'}`);
            console.log(`     largeUrl: ${ann.largeUrl || 'NULL'}`);
        });

        // 3. Check residents with documents
        console.log('\n👥 Residents with Documents:');
        const residents = await Resident.findAll({
            where: {
                validIdPath: { [sequelize.Sequelize.Op.ne]: null }
            },
            attributes: ['id', 'firstName', 'lastName', 'validIdPath', 'proofOfResidencyPath'],
            limit: 5
        });
        console.log(`   Total residents with documents: ${residents.length}`);
        residents.forEach(res => {
            console.log(`   - ID: ${res.id}, Name: ${res.firstName} ${res.lastName}`);
            console.log(`     validIdPath: ${res.validIdPath || 'NULL'}`);
            console.log(`     proofOfResidencyPath: ${res.proofOfResidencyPath || 'NULL'}`);
        });

        // 4. Diagnosis
        console.log('\n🔍 DIAGNOSIS:');
        if (images.length === 0) {
            console.log('   ❌ ISSUE: Images table is empty - image metadata not being saved');
            console.log('   📝 CAUSE: Controllers upload to R2 but don\'t create Image records');
            console.log('   ✅ FIX: Update announcementController.js and authController.js');
            console.log('           to create Image records after R2 upload');
        }

        if (announcements.length > 0 && announcements.some(a => !a.mediumUrl && a.imagePath)) {
            console.log('   ⚠️  WARNING: Old announcements without image variants detected');
        }

        console.log('\n' + '='.repeat(60));
        
    } catch (error) {
        console.error('❌ Diagnostic error:', error);
    } finally {
        await sequelize.close();
    }
}

runDiagnostic();
