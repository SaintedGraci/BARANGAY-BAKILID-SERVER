import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function setupDatabase() {
    try {
        // Connect to MySQL without specifying a database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || ""
        });

        console.log("✅ Connected to MySQL");

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "barangay_system"}`);
        console.log(`✅ Database '${process.env.DB_NAME || "barangay_system"}' created or already exists`);

        await connection.end();
        console.log("✅ Setup complete! You can now run 'npm start'");
    } catch (error) {
        console.error("❌ Setup failed:", error.message);
        process.exit(1);
    }
}

setupDatabase();
