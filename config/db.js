import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || "barangay_system",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
        host: process.env.DB_HOST || "localhost",
        dialect: process.env.DB_DIALECT || "mysql",
        logging: process.env.NODE_ENV === 'production' ? false : console.log,
        pool: {
            max: 10,
            min: 2,
            acquire: 60000,
            idle: 10000
        },
        dialectOptions: process.env.NODE_ENV === 'production' ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
        retry: {
            max: 3
        }
    }
);

export default sequelize;