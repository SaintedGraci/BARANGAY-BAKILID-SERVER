import sequelize from "./config/db.js";
import User from "./models/user.js";
import Resident from "./models/resident.js";
import dotenv from "dotenv";

dotenv.config();

async function resetTestResidents() {
    try {
        console.log("🔧 Resetting test resident accounts...\n");

        await sequelize.authenticate();
        console.log("✅ Database connected\n");

        // Find Maria Santos
        const maria = await User.findOne({ where: { email: 'maria.santos@email.com' } });
        if (maria) {
            await maria.update({ isVerified: false });
            
            const mariaResident = await Resident.findOne({ where: { UserId: maria.id } });
            if (mariaResident) {
                await mariaResident.update({
                    verificationStatus: 'pending',
                    validIdPath: 'uploads/green-tin-id-1024x640-1784358078572.png',
                    proofOfResidencyPath: 'uploads/barnagay residentcy-1784358078631.png'
                });
                console.log("✅ Maria Santos reset to pending");
            }
        }

        // Find Pedro Reyes
        const pedro = await User.findOne({ where: { email: 'pedro.reyes@email.com' } });
        if (pedro) {
            await pedro.update({ isVerified: false });
            
            const pedroResident = await Resident.findOne({ where: { UserId: pedro.id } });
            if (pedroResident) {
                await pedroResident.update({
                    verificationStatus: 'pending',
                    validIdPath: 'uploads/Screenshot (3)-1780895446770.png',
                    proofOfResidencyPath: 'uploads/Screenshot 2026-05-22 164634-1780895446751.png'
                });
                console.log("✅ Pedro Reyes reset to pending");
            }
        }

        console.log("\n🎉 Test residents reset successfully!");
        console.log("\n📋 They should now appear in Pending Verifications tab.");
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Reset failed:", error.message);
        process.exit(1);
    }
}

resetTestResidents();
