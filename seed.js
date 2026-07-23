import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import User from "./models/user.js";
import Resident from "./models/resident.js";
import Official from "./models/official.js";

dotenv.config();

async function seedDatabase() {
    try {
        console.log("🌱 Starting database seeding...");

        // Connect to database
        await sequelize.authenticate();
        console.log("✅ Database connected");

        // Sync models
        await sequelize.sync({ force: false });
        console.log("✅ Models synced");

        // Create Admin User
        const adminPassword = await bcryptjs.hash("admin123", 10);
        const [adminUser, adminCreated] = await User.findOrCreate({
            where: { email: "admin@bakilid.gov.ph" },
            defaults: {
                username: "admin",
                email: "admin@bakilid.gov.ph",
                password: adminPassword,
                role: "admin",
                isVerified: true
            }
        });

        if (adminCreated) {
            console.log("✅ Admin user created");
            console.log("   Email: admin@bakilid.gov.ph");
            console.log("   Password: admin123");
        } else {
            console.log("ℹ️  Admin user already exists");
        }

        // Create Captain User
        const captainPassword = await bcryptjs.hash("captain123", 10);
        const [captainUser, captainCreated] = await User.findOrCreate({
            where: { email: "captain@bakilid.gov.ph" },
            defaults: {
                username: "captain",
                email: "captain@bakilid.gov.ph",
                password: captainPassword,
                role: "captain",
                isVerified: true
            }
        });

        if (captainCreated) {
            console.log("✅ Captain user created");
            console.log("   Email: captain@bakilid.gov.ph");
            console.log("   Password: captain123");

            // Create Official record for captain
            await Official.create({
                firstName: "Juan",
                middleName: "Santos",
                lastName: "Dela Cruz",
                position: "Barangay Captain",
                contactNumber: "09123456789",
                termStart: new Date("2023-01-01"),
                termEnd: new Date("2026-12-31"),
                isActive: true
            });
            console.log("✅ Captain official record created");
        } else {
            console.log("ℹ️  Captain user already exists");
        }

        // Create Secretary User
        const secretaryPassword = await bcryptjs.hash("secretary123", 10);
        const [secretaryUser, secretaryCreated] = await User.findOrCreate({
            where: { email: "secretary@bakilid.gov.ph" },
            defaults: {
                username: "secretary",
                email: "secretary@bakilid.gov.ph",
                password: secretaryPassword,
                role: "secretary",
                isVerified: true
            }
        });

        if (secretaryCreated) {
            console.log("✅ Secretary user created");
            console.log("   Email: secretary@bakilid.gov.ph");
            console.log("   Password: secretary123");

            // Create Official record for secretary
            await Official.create({
                firstName: "Ana",
                middleName: "Cruz",
                lastName: "Reyes",
                position: "Barangay Secretary",
                contactNumber: "09234567890",
                termStart: new Date("2023-01-01"),
                termEnd: new Date("2026-12-31"),
                isActive: true
            });
            console.log("✅ Secretary official record created");
        } else {
            console.log("ℹ️  Secretary user already exists");
        }

        // Create Staff User
        const staffPassword = await bcryptjs.hash("staff123", 10);
        const [staffUser, staffCreated] = await User.findOrCreate({
            where: { email: "staff@bakilid.gov.ph" },
            defaults: {
                username: "staff",
                email: "staff@bakilid.gov.ph",
                password: staffPassword,
                role: "staff",
                isVerified: true
            }
        });

        if (staffCreated) {
            console.log("✅ Staff user created");
            console.log("   Email: staff@bakilid.gov.ph");
            console.log("   Password: staff123");

            // Create Official record for staff
            await Official.create({
                firstName: "Pedro",
                middleName: "Gomez",
                lastName: "Martinez",
                position: "Barangay Staff",
                contactNumber: "09345678901",
                termStart: new Date("2023-01-01"),
                termEnd: new Date("2026-12-31"),
                isActive: true
            });
            console.log("✅ Staff official record created");
        } else {
            console.log("ℹ️  Staff user already exists");
        }

        // Create Resident User 1
        const resident1Password = await bcryptjs.hash("resident123", 10);
        const [resident1User, resident1Created] = await User.findOrCreate({
            where: { email: "maria.santos@email.com" },
            defaults: {
                username: "maria_santos",
                email: "maria.santos@email.com",
                password: resident1Password,
                role: "resident",
                isVerified: false  // Not verified yet - needs admin approval
            }
        });

        if (resident1Created) {
            console.log("✅ Resident 1 user created");
            console.log("   Email: maria.santos@email.com");
            console.log("   Password: resident123");

            // Create Resident profile with pending verification
            await Resident.create({
                firstName: "Maria",
                middleName: "Garcia",
                lastName: "Santos",
                gender: "Female",
                birthDate: new Date("1990-05-15"),
                contactNumber: "09171234567",
                purok: "Purok 1",
                address: "123 Main Street, Bakilid, Mandaue City",
                citizenship: "Filipino",
                UserId: resident1User.id,
                verificationStatus: 'pending',  // Needs verification
                validIdPath: 'uploads/green-tin-id-1024x640-1784358078572.png',  // Sample ID
                proofOfResidencyPath: 'uploads/barnagay residentcy-1784358078631.png'  // Sample proof
            });
            console.log("✅ Resident 1 profile created (pending verification)");
        } else {
            console.log("ℹ️  Resident 1 already exists");
        }

        // Create Resident User 2
        const resident2Password = await bcryptjs.hash("resident123", 10);
        const [resident2User, resident2Created] = await User.findOrCreate({
            where: { email: "pedro.reyes@email.com" },
            defaults: {
                username: "pedro_reyes",
                email: "pedro.reyes@email.com",
                password: resident2Password,
                role: "resident",
                isVerified: false  // Not verified yet - needs admin approval
            }
        });

        if (resident2Created) {
            console.log("✅ Resident 2 user created");
            console.log("   Email: pedro.reyes@email.com");
            console.log("   Password: resident123");

            // Create Resident profile with pending verification
            await Resident.create({
                firstName: "Pedro",
                middleName: "Cruz",
                lastName: "Reyes",
                gender: "Male",
                birthDate: new Date("1985-08-20"),
                contactNumber: "09181234567",
                purok: "Purok 2",
                address: "456 Second Street, Bakilid, Mandaue City",
                citizenship: "Filipino",
                UserId: resident2User.id,
                verificationStatus: 'pending',  // Needs verification
                validIdPath: 'uploads/Screenshot (3)-1780895446770.png',  // Sample ID
                proofOfResidencyPath: 'uploads/Screenshot 2026-05-22 164634-1780895446751.png'  // Sample proof
            });
            console.log("✅ Resident 2 profile created (pending verification)");
        } else {
            console.log("ℹ️  Resident 2 already exists");
        }

        console.log("\n🎉 Database seeding completed successfully!");
        console.log("\n📋 Summary of Accounts:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔧 Admin Account:");
        console.log("  Email: admin@bakilid.gov.ph");
        console.log("  Password: admin123");
        console.log("  Role: System Administrator");
        console.log("\n🏛️ Captain Account:");
        console.log("  Email: captain@bakilid.gov.ph");
        console.log("  Password: captain123");
        console.log("  Role: Barangay Captain");
        console.log("\n📋 Secretary Account:");
        console.log("  Email: secretary@bakilid.gov.ph");
        console.log("  Password: secretary123");
        console.log("  Role: Barangay Secretary");
        console.log("\n👥 Staff Account:");
        console.log("  Email: staff@bakilid.gov.ph");
        console.log("  Password: staff123");
        console.log("  Role: Barangay Staff");
        console.log("\n👤 Resident Account 1:");
        console.log("  Email: maria.santos@email.com");
        console.log("  Password: resident123");
        console.log("  Role: Resident");
        console.log("  Status: ⏳ Pending Verification (Can login but needs admin approval)");
        console.log("\n👤 Resident Account 2:");
        console.log("  Email: pedro.reyes@email.com");
        console.log("  Password: resident123");
        console.log("  Role: Resident");
        console.log("  Status: ⏳ Pending Verification (Can login but needs admin approval)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedDatabase();
