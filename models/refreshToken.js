import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.js";

const RefreshToken = sequelize.define("RefreshToken", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    token: {
        type: DataTypes.STRING(512),
        allowNull: false,
        unique: true
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: "refresh_tokens",
    timestamps: true
});

// Associations
RefreshToken.belongsTo(User, { foreignKey: 'UserId', onDelete: 'CASCADE' });
User.hasMany(RefreshToken, { foreignKey: 'UserId' });

export default RefreshToken;
