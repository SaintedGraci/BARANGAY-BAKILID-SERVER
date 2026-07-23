import sequelize from "./config/db.js";
import User from "./models/user.js";
import Resident from "./models/resident.js";
import dotenv from "dotenv";

dotenv.config();

async function checkResidents() {
    try {
        console.log("🔍 Checking resident accounts...\n");

        await sequelize.authenticate();
        console.log("✅ Database connected\n");

        // Get all users with resident role
        const users = await User.findAll({
            where: { role: 'resident' },
            attributes: ['id', 'username', 'email', 'isVerified', 'createdAt']
        });

        console.log(`📋 Found ${users.length} resident users:\n`);
        
        for (const user of users) {
            console.log(`👤 User ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   isVerified: ${user.isVerified}`);
            
            // Get resident profile
            const resident = await Resident.findOne({ where: { UserId: user.id } });
            
            if (resident) {
                console.log(`   Resident ID: ${resident.id}`);
                console.log(`   Name: ${resident.firstName} ${resident.lastName}`);
                console.log(`   verificationStatus: ${resident.verificationStatus}`);
                console.log(`   Has Valid ID: ${resident.validIdPath ? 'Yes' : 'No'}`);
                console.log(`   Has Proof: ${resident.proofOfResidencyPath ? 'Yes' : 'No'}`);
            } else {
                console.log(`   ⚠️  NO RESIDENT PROFILE FOUND`);
            }
            console.log('');
        }

        // Check what getPendingVerifications would return
        console.log("🔍 Checking pending verifications query...\n");
        const pending = await Resident.findAll({
            where: { verificationStatus: 'pending' },
            include: [{
                model: User,
                attributes: ['id', 'username', 'email', 'isVerified']
            }]
        });

        console.log(`📊 Residents with verificationStatus='pending': ${pending.length}\n`);
        
        pending.forEach(r => {
            console.log(`   - ${r.firstName} ${r.lastName} (${r.User?.email})`);
        });

        if (pending.length === 0) {
            console.log("   ❌ No pending residents found!");
            console.log("\n💡 This is why the Verifications tab is empty.");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

checkResidents();
