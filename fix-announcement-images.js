import sequelize from "./config/db.js";
import Announcement from "./models/announcement.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

async function fixAnnouncementImagePaths() {
    try {
        console.log("🔧 Fixing announcement image paths...");

        await sequelize.authenticate();
        console.log("✅ Database connected");

        // Get all announcements with image paths
        const announcements = await Announcement.findAll({
            where: {
                imagePath: {
                    [sequelize.Sequelize.Op.ne]: null
                }
            }
        });

        console.log(`📋 Found ${announcements.length} announcements with images`);

        let fixed = 0;
        for (const announcement of announcements) {
            const oldPath = announcement.imagePath;
            
            // Check if path is a full Windows path
            if (oldPath && (oldPath.includes('\\') || oldPath.includes(':'))) {
                // Extract just the filename
                const filename = path.basename(oldPath);
                const newPath = `uploads/${filename}`;
                
                await announcement.update({ imagePath: newPath });
                
                console.log(`✅ Fixed: ${oldPath}`);
                console.log(`   → ${newPath}`);
                fixed++;
            }
        }

        if (fixed === 0) {
            console.log("✨ All image paths are already correct!");
        } else {
            console.log(`\n🎉 Fixed ${fixed} announcement image paths!`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Fix failed:", error.message);
        process.exit(1);
    }
}

fixAnnouncementImagePaths();
