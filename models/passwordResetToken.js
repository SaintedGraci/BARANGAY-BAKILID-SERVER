import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.js";
import crypto from "crypto";

const PasswordResetToken = sequelize.define("PasswordResetToken", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    tokenHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'SHA256 hash of the token for security'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Token expiration time (15-30 minutes from creation)'
    },
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether this token has been used'
    },
    usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the token was used'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP address that requested the reset'
    }
}, {
    tableName: "password_reset_tokens",
    timestamps: true,
    indexes: [
        {
            fields: ['UserId']
        },
        {
            fields: ['token'],
            unique: true
        },
        {
            fields: ['tokenHash']
        },
        {
            fields: ['expiresAt']
        }
    ]
});

// Static method to generate secure token
PasswordResetToken.generateToken = function() {
    return crypto.randomBytes(32).toString('hex');
};

// Static method to hash token
PasswordResetToken.hashToken = function(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Instance method to check if token is expired
PasswordResetToken.prototype.isExpired = function() {
    return new Date() > this.expiresAt;
};

// Instance method to check if token is valid (not expired and not used)
PasswordResetToken.prototype.isValid = function() {
    return !this.used && !this.isExpired();
};

// Associations
PasswordResetToken.belongsTo(User, { 
    foreignKey: 'UserId', 
    onDelete: 'CASCADE',
    as: 'user'
});
User.hasMany(PasswordResetToken, { 
    foreignKey: 'UserId',
    as: 'passwordResetTokens'
});

export default PasswordResetToken;
