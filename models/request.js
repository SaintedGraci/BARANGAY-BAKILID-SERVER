import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Resident from "./resident.js";

const Request = sequelize.define("Request", {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    documentType: {
        type: DataTypes.ENUM(
            "Barangay Clearance",
            "Certificate of Residency",
            "Indigency Certificate",
            "Business Permit",
            "Certificate of Good Moral",
            "Community Tax Certificate (Cedula)"
        ),
        allowNull: false,
    },

    purpose: {
        type: DataTypes.STRING,
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

});

Resident.hasMany(Request);
Request.belongsTo(Resident);

export default Request;