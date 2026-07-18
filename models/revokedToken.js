import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const RevokedToken = sequelize.define("RevokedToken", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    token: {
        type: DataTypes.STRING(512),  // Changed from TEXT to STRING with fixed length
        allowNull: false,
        unique: true
    },
    tokenType: {
        type: DataTypes.ENUM('access', 'refresh'),
        allowNull: false,
        defaultValue: 'access'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: "revoked_tokens",
    timestamps: true,
    indexes: [
        {
            fields: ['token']
        },
        {
            fields: ['expiresAt']
        }
    ]
});

export default RevokedToken;
