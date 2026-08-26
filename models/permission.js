import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  module: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'permissions',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

export default Permission;
