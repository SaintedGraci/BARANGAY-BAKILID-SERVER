import logger from '../config/logger.js';
import permissionCache from './permissionCache.js';

/**
 * Real-Time Synchronization Service
 * Manages Socket.IO events for permission and configuration updates
 */
class RealTimeSyncService {
  constructor() {
    this.io = null;
    logger.info('🔄 Real-time sync service initialized');
  }

  /**
   * Initialize with Socket.IO instance
   */
  init(io) {
    this.io = io;
    
    // Listen to permission cache events
    permissionCache.on('roleInvalidated', (data) => {
      this.broadcastPermissionUpdate('role_invalidated', data);
    });
    
    permissionCache.on('permissionInvalidated', (data) => {
      this.broadcastPermissionUpdate('permission_invalidated', data);
    });
    
    permissionCache.on('allInvalidated', (data) => {
      this.broadcastPermissionUpdate('all_permissions_invalidated', data);
    });
    
    logger.info('✅ Real-time sync service connected to Socket.IO');
  }

  /**
   * Broadcast permission matrix update to all connected clients
   */
  broadcastPermissionUpdate(eventType, data) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, cannot broadcast permission update');
      return;
    }

    const payload = {
      type: eventType,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Broadcast to all admin users (captain, secretary, staff, admin)
    this.io.emit('permission_updated', payload);
    
    logger.info(`🔄 Permission update broadcasted: ${eventType}`, payload);
  }

  /**
   * Notify role-specific users about permission changes
   */
  notifyRolePermissionChange(role, permissions, action = 'updated') {
    if (!this.io) return;

    const payload = {
      type: 'role_permissions_changed',
      role,
      permissions,
      action,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all clients - they can filter by their role
    this.io.emit('role_permissions_changed', payload);
    
    // Also invalidate permission cache for this role
    permissionCache.invalidateRole(role);
    
    logger.info(`🔐 Role permission change notified: ${role} - ${action}`, { permissions });
  }

  /**
   * Broadcast document service updates to residents
   */
  broadcastDocumentServiceUpdate(action, service) {
    if (!this.io) return;

    const payload = {
      type: 'document_service_updated',
      action, // 'created', 'updated', 'deleted'
      service,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all clients (especially residents)
    this.io.emit('document_service_updated', payload);
    
    logger.info(`📄 Document service update broadcasted: ${action}`, { serviceId: service?.id, serviceName: service?.name });
  }

  /**
   * Broadcast system settings update
   */
  broadcastSystemSettingsUpdate(settings, action = 'updated') {
    if (!this.io) return;

    const payload = {
      type: 'system_settings_updated',
      settings,
      action,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all admin clients
    this.io.emit('system_settings_updated', payload);
    
    logger.info(`⚙️ System settings update broadcasted: ${action}`, { count: settings?.length });
  }

  /**
   * Broadcast feature flag update
   */
  broadcastFeatureFlagUpdate(flag, action = 'updated') {
    if (!this.io) return;

    const payload = {
      type: 'feature_flag_updated',
      flag,
      action,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all clients
    this.io.emit('feature_flag_updated', payload);
    
    logger.info(`🚩 Feature flag update broadcasted: ${flag?.key} = ${flag?.isEnabled}`);
  }

  /**
   * Force user to refresh their permissions (nuclear option)
   */
  forceUserPermissionRefresh(userId, reason = 'Permission changes detected') {
    if (!this.io) return;

    const payload = {
      type: 'force_permission_refresh',
      reason,
      timestamp: new Date().toISOString(),
    };

    // Send to specific user's room
    this.io.to(`user_${userId}`).emit('force_permission_refresh', payload);
    
    logger.info(`🔄 Force permission refresh sent to user ${userId}: ${reason}`);
  }

  /**
   * Broadcast to specific user role
   */
  broadcastToRole(role, event, data) {
    if (!this.io) return;

    const payload = {
      targetRole: role,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Emit to all clients, they can filter by role
    this.io.emit(event, payload);
    
    logger.info(`📢 Broadcast to ${role}: ${event}`, payload);
  }

  /**
   * Broadcast UI refresh requirement (for immediate visual updates)
   */
  broadcastUIRefresh(component, data = {}) {
    if (!this.io) return;

    const payload = {
      type: 'ui_refresh_required',
      component, // 'permissions', 'document_services', 'announcements', etc.
      data,
      timestamp: new Date().toISOString(),
    };

    this.io.emit('ui_refresh_required', payload);
    
    logger.info(`🔄 UI refresh broadcasted for component: ${component}`);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    if (!this.io) return { connected: 0 };

    return {
      connected: this.io.sockets.sockets.size,
      rooms: Object.keys(this.io.sockets.adapter.rooms || {}),
    };
  }
}

// Create singleton instance
const realTimeSyncService = new RealTimeSyncService();

export default realTimeSyncService;