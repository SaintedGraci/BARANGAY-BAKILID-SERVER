import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Announcement = sequelize.define("Announcement", {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    status: {
        type: DataTypes.ENUM("Active", "Inactive", "Archived"),
        defaultValue: "Active",
    },

    priority: {
        type: DataTypes.ENUM("Low", "Medium", "High", "Urgent"),
        defaultValue: "Medium",
    },

    expiryDate: {
        type: DataTypes.DATE,
    },

    imagePath: {
        type: DataTypes.STRING,
        allowNull: true,
    },

});

export default Announcement;
