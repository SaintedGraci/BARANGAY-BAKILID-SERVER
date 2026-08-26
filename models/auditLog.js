import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userRole: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  module: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  targetType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  oldValue: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  newValue: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'success',
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
});

// Define association
AuditLog.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user',
  constraints: false 
});

export default AuditLog;
