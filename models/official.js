import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Official = sequelize.define("Official", {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    middleName: {
        type: DataTypes.STRING,
    },

    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    position: {
        type: DataTypes.ENUM(
            "Barangay Captain",
            "Barangay Kagawad",
            "SK Chairman",
            "Barangay Secretary",
            "Barangay Treasurer"
        ),
        allowNull: false,
    },

    contactNumber: {
        type: DataTypes.STRING,
    },

    termStart: {
        type: DataTypes.DATE,
    },

    termEnd: {
        type: DataTypes.DATE,
    },

    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },

});

export default Official;