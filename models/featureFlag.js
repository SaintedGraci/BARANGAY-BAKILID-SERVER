import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const FeatureFlag = sequelize.define('FeatureFlag', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'feature_flags',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

export default FeatureFlag;
