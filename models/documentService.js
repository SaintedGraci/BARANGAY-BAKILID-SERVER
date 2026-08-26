import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const DocumentService = sequelize.define('DocumentService', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  processingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  isFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  processingDays: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  allowOnlineRequest: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  requiresVerification: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  maxRequests: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'DocumentServices',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

export default DocumentService;
