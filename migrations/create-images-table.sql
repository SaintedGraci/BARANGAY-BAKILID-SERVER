-- =====================================================
-- Create Images Table for Optimized Image Storage
-- =====================================================
-- This table stores metadata for all optimized images
-- uploaded to Cloudflare R2 with WebP compression
-- =====================================================

CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- File information
    original_name VARCHAR(255) NOT NULL COMMENT 'Original filename uploaded by user',
    r2_key VARCHAR(500) NOT NULL UNIQUE COMMENT 'Unique key/path in R2 bucket',
    url VARCHAR(1000) NOT NULL COMMENT 'Public CDN URL for the image',
    
    -- Image metadata
    width INT NULL COMMENT 'Image width in pixels after optimization',
    height INT NULL COMMENT 'Image height in pixels after optimization',
    size INT NOT NULL COMMENT 'File size in bytes after optimization',
    mimetype VARCHAR(50) NOT NULL DEFAULT 'image/webp' COMMENT 'MIME type (should be image/webp)',
    
    -- Organization
    category VARCHAR(100) NULL COMMENT 'Category/folder: announcements, documents, profiles, etc.',
    related_type VARCHAR(100) NULL COMMENT 'Related entity type: Announcement, Resident, Request, etc.',
    related_id INT NULL COMMENT 'ID of the related entity',
    
    -- Tracking
    uploaded_by INT NULL COMMENT 'User ID who uploaded the image',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT 'Soft delete flag',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_r2_key (r2_key),
    INDEX idx_category (category),
    INDEX idx_related (related_type, related_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_created_at (created_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores optimized image metadata for Cloudflare R2 storage';

-- =====================================================
-- Example Queries
-- =====================================================

-- Get all announcement images
-- SELECT * FROM images WHERE category = 'announcements' AND is_deleted = FALSE ORDER BY created_at DESC;

-- Get images for a specific announcement
-- SELECT * FROM images WHERE related_type = 'Announcement' AND related_id = 1 AND is_deleted = FALSE;

-- Get total storage used
-- SELECT SUM(size) as total_bytes, COUNT(*) as total_images FROM images WHERE is_deleted = FALSE;

-- Get storage by category
-- SELECT category, COUNT(*) as count, SUM(size) as total_bytes FROM images WHERE is_deleted = FALSE GROUP BY category;
