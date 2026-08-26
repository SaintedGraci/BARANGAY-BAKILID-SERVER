import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Resident from "./resident.js";

const Request = sequelize.define("Request", {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    // Foreign key to DocumentServices table
    DocumentServiceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'DocumentServices',
            key: 'id',
        },
    },

    // Legacy field - kept for backward compatibility (can be removed after migration)
    documentType: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },

    purpose: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    status: {
        type: DataTypes.ENUM(
            "Pending",
            "Processing",
            "Ready for Release",
            "Claimed",
            "Rejected"
        ),
        defaultValue: "Pending",
    },

    remarks: {
        type: DataTypes.TEXT,
    },

    releaseDate: {
        type: DataTypes.DATE,
    },

    // Additional fields for better tracking
    requestedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },

    processedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id',
        },
    },

    processingFee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
    },

    paymentStatus: {
        type: DataTypes.ENUM('Unpaid', 'Paid', 'Waived'),
        defaultValue: 'Unpaid',
    },

});

Resident.hasMany(Request);
Request.belongsTo(Resident);

export default Request;