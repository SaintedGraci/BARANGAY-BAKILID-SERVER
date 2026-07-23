import sequelize from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

async function updateRoleEnum() {
    try {
        console.log("🔧 Updating User role ENUM to include 'secretary'...");

        await sequelize.authenticate();
        console.log("✅ Database connected");

        // Update the ENUM to include secretary
        await sequelize.query(`
            ALTER TABLE Users 
            MODIFY COLUMN role ENUM('resident', 'staff', 'secretary', 'captain', 'admin') 
            DEFAULT 'resident'
        `);

        console.log("✅ Role ENUM updated successfully!");
        console.log("   New roles: resident, staff, secretary, captain, admin");
        console.log("\n🎉 You can now run: npm run seed");
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Update failed:", error.message);
        process.exit(1);
    }
}

updateRoleEnum();
