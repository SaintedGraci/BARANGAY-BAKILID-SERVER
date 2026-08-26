import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  role: {
    type: DataTypes.ENUM('captain', 'secretary', 'staff'),
    allowNull: false,
  },
  permissionKey: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  granted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'role_permissions',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

export default RolePermission;
