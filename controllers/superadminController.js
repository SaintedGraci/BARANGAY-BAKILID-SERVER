import { Op } from 'sequelize';
import Permission from '../models/permission.js';
import RolePermission from '../models/rolePermission.js';
import DocumentService from '../models/documentService.js';
import SystemSetting from '../models/systemSetting.js';
import FeatureFlag from '../models/featureFlag.js';
import AuditLog from '../models/auditLog.js';
import User from '../models/user.js';
import Request from '../models/request.js';
import Resident from '../models/resident.js';
import logger from '../config/logger.js';
import sequelize from '../config/db.js';
import realTimeSyncService from '../services/realTimeSyncService.js';

// ============ AUDIT LOG HELPER ============
const createAuditLog = async (req, action, module, targetId, targetType, description, oldValue, newValue, status = 'success') => {
  try {
    await AuditLog.create({
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      action,
      module,
      targetId,
      targetType,
      description,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      status,
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};

// ============ DASHBOARD & SYSTEM HEALTH ============

// Get system dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const inactiveUsers = await User.count({ where: { status: 'inactive' } });
    const adminUsers = await User.count({ where: { role: { [Op.ne]: 'resident' } } });
    
    // Resident statistics
    const totalResidents = await Resident.count();
    const verifiedResidents = await Resident.count({ where: { verificationStatus: 'verified' } });
    const pendingResidents = await Resident.count({ where: { verificationStatus: 'pending' } });
    
    // Document service statistics
    const totalDocumentServices = await DocumentService.count();
    const activeServices = await DocumentService.count({ where: { isAvailable: true } });
    const inactiveServices = await DocumentService.count({ where: { isAvailable: false } });
    
    // Request statistics
    const totalRequests = await Request.count();
    const pendingRequests = await Request.count({ where: { status: 'pending' } });
    const approvedRequests = await Request.count({ where: { status: 'approved' } });
    const completedRequests = await Request.count({ where: { status: 'completed' } });
    const rejectedRequests = await Request.count({ where: { status: 'rejected' } });
    
    // Recent audit logs (security events)
    const recentAuditLogs = await AuditLog.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'role'],
        required: false
      }]
    });
    
    // System health checks
    const systemHealth = {
      database: 'healthy',
      api: 'healthy',
      authentication: 'healthy',
      storage: 'healthy'
    };
    
    try {
      await sequelize.authenticate();
    } catch (error) {
      systemHealth.database = 'error';
      logger.error('Database health check failed:', error);
    }
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          admins: adminUsers,
        },
        residents: {
          total: totalResidents,
          verified: verifiedResidents,
          pending: pendingResidents,
        },
        documentServices: {
          total: totalDocumentServices,
          active: activeServices,
          inactive: inactiveServices,
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          completed: completedRequests,
          rejected: rejectedRequests,
        },
        recentAuditLogs,
        systemHealth,
      },
    });
    
    await createAuditLog(req, 'VIEW_DASHBOARD', 'Dashboard', null, null, 'Viewed superadmin dashboard statistics', null, null);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ PERMISSIONS MANAGEMENT ============

// Get all permissions
export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [['module', 'ASC'], ['key', 'ASC']],
    });
    
    // Group by module
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        permissions,
        groupedPermissions,
      },
    });
  } catch (error) {
    logger.error('Error fetching permissions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get role permissions
export const getRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!['captain', 'secretary', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const rolePermissions = await RolePermission.findAll({
      where: { role },
    });
    
    res.json({
      success: true,
      data: {
        role,
        permissions: rolePermissions,
      },
    });
  } catch (error) {
    logger.error('Error fetching role permissions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all roles' permissions (permission matrix)
export const getAllRolesPermissions = async (req, res) => {
  try {
    const allPermissions = await Permission.findAll({
      order: [['module', 'ASC'], ['key', 'ASC']],
    });
    
    const captainPerms = await RolePermission.findAll({ where: { role: 'captain', granted: true } });
    const secretaryPerms = await RolePermission.findAll({ where: { role: 'secretary', granted: true } });
    const staffPerms = await RolePermission.findAll({ where: { role: 'staff', granted: true } });
    
    const captainKeys = new Set(captainPerms.map(p => p.permissionKey));
    const secretaryKeys = new Set(secretaryPerms.map(p => p.permissionKey));
    const staffKeys = new Set(staffPerms.map(p => p.permissionKey));
    
    const permissionMatrix = allPermissions.map(perm => ({
      key: perm.key,
      label: perm.label,
      module: perm.module,
      description: perm.description,
      captain: captainKeys.has(perm.key),
      secretary: secretaryKeys.has(perm.key),
      staff: staffKeys.has(perm.key),
    }));
    
    res.json({
      success: true,
      data: {
        permissionMatrix,
      },
    });
  } catch (error) {
    logger.error('Error fetching permission matrix:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update role permissions
export const updateRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body; // Array of { permissionKey, granted }
    
    if (!['captain', 'secretary', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Permissions must be an array' });
    }
    
    // Get old permissions for audit
    const oldPermissions = await RolePermission.findAll({ where: { role } });
    
    // Update permissions in transaction
    await sequelize.transaction(async (t) => {
      // Delete all existing permissions for this role
      await RolePermission.destroy({ where: { role }, transaction: t });
      
      // Insert new permissions (only granted ones)
      const newPermissions = permissions
        .filter(p => p.granted)
        .map(p => ({
          role,
          permissionKey: p.permissionKey,
          granted: true,
        }));
      
      if (newPermissions.length > 0) {
        await RolePermission.bulkCreate(newPermissions, { transaction: t });
      }
    });
    
    const updatedPermissions = await RolePermission.findAll({ where: { role } });
    
    await createAuditLog(
      req,
      'UPDATE_ROLE_PERMISSIONS',
      'Permissions',
      null,
      'RolePermission',
      `Updated permissions for role: ${role}`,
      { permissions: oldPermissions.map(p => p.permissionKey) },
      { permissions: updatedPermissions.map(p => p.permissionKey) }
    );
    
    // TASK16: Broadcast permission changes in real-time
    realTimeSyncService.notifyRolePermissionChange(
      role,
      updatedPermissions.map(p => p.permissionKey),
      'updated'
    );
    
    // Broadcast UI refresh to force immediate updates
    realTimeSyncService.broadcastUIRefresh('permissions', { role });
    
    res.json({
      success: true,
      message: `Permissions updated for ${role}`,
      data: {
        role,
        permissions: updatedPermissions,
      },
    });
  } catch (error) {
    logger.error('Error updating role permissions:', error);
    await createAuditLog(req, 'UPDATE_ROLE_PERMISSIONS', 'Permissions', null, 'RolePermission', `Failed to update permissions for role: ${req.params.role}`, null, null, 'failure');
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ DOCUMENT SERVICES MANAGEMENT ============

// Get all document services
export const getAllDocumentServices = async (req, res) => {
  try {
    const { search, category, isAvailable, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await DocumentService.findAndCountAll({
      where,
      order: [['priority', 'ASC'], ['name', 'ASC']],
      limit: parseInt(limit),
      offset,
    });
    
    res.json({
      success: true,
      data: {
        services: rows,
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching document services:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single document service
export const getDocumentService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await DocumentService.findByPk(id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Document service not found' });
    }
    
    res.json({
      success: true,
      data: { service },
    });
  } catch (error) {
    logger.error('Error fetching document service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create document service
export const createDocumentService = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      processingFee,
      isFree,
      processingDays,
      isAvailable,
      allowOnlineRequest,
      requiresVerification,
      requiresApproval,
      priority,
      maxRequests,
      notes,
    } = req.body;
    
    // Check if service name already exists
    const existing = await DocumentService.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Document service with this name already exists' });
    }
    
    const service = await DocumentService.create({
      name,
      description,
      category,
      processingFee: isFree ? 0 : processingFee,
      isFree: isFree || false,
      processingDays: processingDays || 3,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      allowOnlineRequest: allowOnlineRequest !== undefined ? allowOnlineRequest : true,
      requiresVerification: requiresVerification !== undefined ? requiresVerification : true,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
      priority: priority || 100,
      maxRequests,
      notes,
    });
    
    await createAuditLog(
      req,
      'CREATE_DOCUMENT_SERVICE',
      'Document Services',
      service.id,
      'DocumentService',
      `Created document service: ${service.name}`,
      null,
      { service }
    );
    
    // TASK16: Broadcast new document service to all clients (especially residents)
    realTimeSyncService.broadcastDocumentServiceUpdate('created', service.toJSON());
    realTimeSyncService.broadcastUIRefresh('document_services');
    
    res.status(201).json({
      success: true,
      message: 'Document service created successfully',
      data: { service },
    });
  } catch (error) {
    logger.error('Error creating document service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update document service
export const updateDocumentService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const service = await DocumentService.findByPk(id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Document service not found' });
    }
    
    const oldValue = { ...service.toJSON() };
    
    // If setting isFree to true, set processingFee to 0
    if (updates.isFree === true) {
      updates.processingFee = 0;
    }
    
    await service.update(updates);
    
    await createAuditLog(
      req,
      'UPDATE_DOCUMENT_SERVICE',
      'Document Services',
      service.id,
      'DocumentService',
      `Updated document service: ${service.name}`,
      oldValue,
      { service }
    );
    
    // TASK16: Broadcast document service update
    realTimeSyncService.broadcastDocumentServiceUpdate('updated', service.toJSON());
    realTimeSyncService.broadcastUIRefresh('document_services');
    
    res.json({
      success: true,
      message: 'Document service updated successfully',
      data: { service },
    });
  } catch (error) {
    logger.error('Error updating document service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete document service (soft delete by setting isAvailable to false)
export const deleteDocumentService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await DocumentService.findByPk(id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Document service not found' });
    }
    
    const oldValue = { ...service.toJSON() };
    
    // Soft delete - set as unavailable instead of actual deletion
    await service.update({ isAvailable: false });
    
    await createAuditLog(
      req,
      'DELETE_DOCUMENT_SERVICE',
      'Document Services',
      service.id,
      'DocumentService',
      `Deactivated document service: ${service.name}`,
      oldValue,
      { isAvailable: false }
    );
    
    // TASK16: Broadcast document service deletion
    realTimeSyncService.broadcastDocumentServiceUpdate('deleted', service.toJSON());
    realTimeSyncService.broadcastUIRefresh('document_services');
    
    res.json({
      success: true,
      message: 'Document service deactivated successfully',
      data: { service },
    });
  } catch (error) {
    logger.error('Error deleting document service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ SYSTEM SETTINGS MANAGEMENT ============

// Get all system settings
export const getAllSystemSettings = async (req, res) => {
  try {
    const { category } = req.query;
    
    const where = {};
    if (category) {
      where.category = category;
    }
    
    const settings = await SystemSetting.findAll({
      where,
      order: [['category', 'ASC'], ['key', 'ASC']],
    });
    
    // Group by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        settings,
        groupedSettings,
      },
    });
  } catch (error) {
    logger.error('Error fetching system settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single system setting
export const getSystemSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await SystemSetting.findOne({ where: { key } });
    
    if (!setting) {
      return res.status(404).json({ success: false, message: 'System setting not found' });
    }
    
    res.json({
      success: true,
      data: { setting },
    });
  } catch (error) {
    logger.error('Error fetching system setting:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update system setting
export const updateSystemSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const setting = await SystemSetting.findOne({ where: { key } });
    
    if (!setting) {
      return res.status(404).json({ success: false, message: 'System setting not found' });
    }
    
    const oldValue = setting.value;
    
    await setting.update({
      value,
      updatedBy: req.user?.id || null,
    });
    
    await createAuditLog(
      req,
      'UPDATE_SYSTEM_SETTING',
      'System Settings',
      setting.id,
      'SystemSetting',
      `Updated system setting: ${setting.label}`,
      { key: setting.key, value: oldValue },
      { key: setting.key, value }
    );
    
    res.json({
      success: true,
      message: 'System setting updated successfully',
      data: { setting },
    });
  } catch (error) {
    logger.error('Error updating system setting:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Bulk update system settings
export const bulkUpdateSystemSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Array of { key, value }
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: 'Settings must be an array' });
    }
    
    const updatedSettings = [];
    
    for (const { key, value } of settings) {
      const setting = await SystemSetting.findOne({ where: { key } });
      
      if (setting) {
        const oldValue = setting.value;
        await setting.update({
          value,
          updatedBy: req.user?.id || null,
        });
        
        updatedSettings.push(setting);
        
        await createAuditLog(
          req,
          'UPDATE_SYSTEM_SETTING',
          'System Settings',
          setting.id,
          'SystemSetting',
          `Updated system setting: ${setting.label}`,
          { key: setting.key, value: oldValue },
          { key: setting.key, value }
        );
      }
    }
    
    // TASK16: Broadcast system settings update
    realTimeSyncService.broadcastSystemSettingsUpdate(
      updatedSettings.map(s => ({ key: s.key, value: s.value, label: s.label })),
      'updated'
    );
    realTimeSyncService.broadcastUIRefresh('system_settings');
    
    res.json({
      success: true,
      message: `Updated ${updatedSettings.length} system settings`,
      data: { settings: updatedSettings },
    });
  } catch (error) {
    logger.error('Error bulk updating system settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ FEATURE FLAGS MANAGEMENT ============

// Get all feature flags
export const getAllFeatureFlags = async (req, res) => {
  try {
    const flags = await FeatureFlag.findAll({
      order: [['key', 'ASC']],
    });
    
    res.json({
      success: true,
      data: { flags },
    });
  } catch (error) {
    logger.error('Error fetching feature flags:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single feature flag
export const getFeatureFlag = async (req, res) => {
  try {
    const { key } = req.params;
    
    const flag = await FeatureFlag.findOne({ where: { key } });
    
    if (!flag) {
      return res.status(404).json({ success: false, message: 'Feature flag not found' });
    }
    
    res.json({
      success: true,
      data: { flag },
    });
  } catch (error) {
    logger.error('Error fetching feature flag:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Toggle feature flag
export const toggleFeatureFlag = async (req, res) => {
  try {
    const { key } = req.params;
    const { isEnabled } = req.body;
    
    const flag = await FeatureFlag.findOne({ where: { key } });
    
    if (!flag) {
      return res.status(404).json({ success: false, message: 'Feature flag not found' });
    }
    
    const oldValue = flag.isEnabled;
    
    await flag.update({
      isEnabled,
      updatedBy: req.user?.id || null,
    });
    
    await createAuditLog(
      req,
      'TOGGLE_FEATURE_FLAG',
      'Feature Flags',
      flag.id,
      'FeatureFlag',
      `${isEnabled ? 'Enabled' : 'Disabled'} feature: ${flag.label}`,
      { key: flag.key, isEnabled: oldValue },
      { key: flag.key, isEnabled }
    );
    
    // TASK16: Broadcast feature flag update
    realTimeSyncService.broadcastFeatureFlagUpdate(
      { key: flag.key, label: flag.label, isEnabled: flag.isEnabled, description: flag.description },
      'updated'
    );
    realTimeSyncService.broadcastUIRefresh('feature_flags');
    
    res.json({
      success: true,
      message: `Feature flag ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: { flag },
    });
  } catch (error) {
    logger.error('Error toggling feature flag:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ AUDIT LOGS ============

// Get audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const {
      search,
      module,
      action,
      userId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;
    
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    
    if (module) {
      where.module = module;
    }
    
    if (action) {
      where.action = action;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });
    
    res.json({
      success: true,
      data: {
        logs: rows,
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Export audit logs (for download)
export const exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, module, action } = req.query;
    
    const where = {};
    
    if (module) {
      where.module = module;
    }
    
    if (action) {
      where.action = action;
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }
    
    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 10000, // Max 10k records for export
    });
    
    await createAuditLog(
      req,
      'EXPORT_AUDIT_LOGS',
      'Audit Logs',
      null,
      'AuditLog',
      `Exported ${logs.length} audit log records`,
      null,
      { count: logs.length, filters: { module, action, startDate, endDate } }
    );
    
    res.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    logger.error('Error exporting audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
