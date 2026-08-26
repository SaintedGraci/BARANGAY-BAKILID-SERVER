import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SystemSetting = sequelize.define('SystemSetting', {
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
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string',
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'system_settings',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

export default SystemSetting;
