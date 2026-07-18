import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Resident from "./resident.js";

const Complaint = sequelize.define("Complaint", {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    subject: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    status: {
        type: DataTypes.ENUM(
            "Pending",
            "Investigating",
            "Resolved"
        ),
        defaultValue: "Pending",
    },

});

Resident.hasMany(Complaint);
Complaint.belongsTo(Resident);

export default Complaint;