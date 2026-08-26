import EventEmitter from 'events';
import logger from '../config/logger.js';

/**
 * Permission Cache Service - In-memory cache with invalidation
 * Provides fast permission lookups with real-time cache invalidation
 */
class PermissionCacheService extends EventEmitter {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes TTL
    this.cleanupInterval = 5 * 60 * 1000; // Cleanup every 5 minutes
    
    // Start cleanup interval
    this.startCleanup();
    
    logger.info('🔐 Permission cache service initialized');
  }

  /**
   * Generate cache key for user role and permission
   */
  generateKey(role, permissionKey) {
    return `perm:${role}:${permissionKey}`;
  }

  /**
   * Get permission from cache
   */
  get(role, permissionKey) {
    const key = this.generateKey(role, permissionKey);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  /**
   * Set permission in cache
   */
  set(role, permissionKey, hasPermission) {
    const key = this.generateKey(role, permissionKey);
    const expiresAt = Date.now() + this.cacheTimeout;
    
    this.cache.set(key, {
      value: hasPermission,
      expiresAt,
      role,
      permissionKey
    });
    
    logger.debug(`Permission cached: ${key} = ${hasPermission}`);
  }

  /**
   * Invalidate cache for specific role
   */
  invalidateRole(role) {
    const keysToDelete = [];
    
    for (const [key, cached] of this.cache.entries()) {
      if (cached.role === role) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    logger.info(`🔄 Cache invalidated for role: ${role} (${keysToDelete.length} entries)`);
    
    // Emit invalidation event
    this.emit('roleInvalidated', { role, count: keysToDelete.length });
    
    return keysToDelete.length;
  }

  /**
   * Invalidate cache for specific permission across all roles
   */
  invalidatePermission(permissionKey) {
    const keysToDelete = [];
    
    for (const [key, cached] of this.cache.entries()) {
      if (cached.permissionKey === permissionKey) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    logger.info(`🔄 Cache invalidated for permission: ${permissionKey} (${keysToDelete.length} entries)`);
    
    // Emit invalidation event
    this.emit('permissionInvalidated', { permissionKey, count: keysToDelete.length });
    
    return keysToDelete.length;
  }

  /**
   * Invalidate all permission cache
   */
  invalidateAll() {
    const count = this.cache.size;
    this.cache.clear();
    
    logger.info(`🔄 All permission cache invalidated (${count} entries)`);
    
    // Emit invalidation event
    this.emit('allInvalidated', { count });
    
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const cached of this.cache.values()) {
      if (now > cached.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hitCount: this.hitCount || 0,
      missCount: this.missCount || 0
    };
  }

  /**
   * Start periodic cleanup of expired entries
   */
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete = [];
      
      for (const [key, cached] of this.cache.entries()) {
        if (now > cached.expiresAt) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.cache.delete(key));
      
      if (keysToDelete.length > 0) {
        logger.debug(`🧹 Cleaned up ${keysToDelete.length} expired permission cache entries`);
      }
    }, this.cleanupInterval);
  }

  /**
   * Reset hit/miss counters (for testing)
   */
  resetCounters() {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// Create singleton instance
const permissionCache = new PermissionCacheService();

export default permissionCache;