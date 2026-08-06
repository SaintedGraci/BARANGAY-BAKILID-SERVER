
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    fullName: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    contactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    role: {
        type: DataTypes.ENUM(
            "resident",
            "staff",
            "secretary",
            "captain",
            "admin"
        ),
        defaultValue: "resident",
    },

    status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
    },

    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },

});

export default User;