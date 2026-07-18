import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.js";

const Resident = sequelize.define("Resident", {

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

    gender: {
        type: DataTypes.ENUM("Male", "Female"),
    },

    birthDate: {
        type: DataTypes.DATE,
    },

    contactNumber: {
        type: DataTypes.STRING,
    },

    purok: {
        type: DataTypes.STRING,
    },

    address: {
        type: DataTypes.STRING,
    },

    citizenship: {
        type: DataTypes.STRING,
        defaultValue: "Filipino",
    },

    validIdPath: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    proofOfResidencyPath: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    verificationStatus: {
        type: DataTypes.ENUM("pending", "verified", "rejected"),
        defaultValue: "pending",
    }

});

User.hasOne(Resident);
Resident.belongsTo(User);

export default Resident;