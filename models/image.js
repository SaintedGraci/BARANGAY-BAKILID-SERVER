import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Image Model - Stores optimized images uploaded to Cloudflare R2
 * This table tracks all images with metadata for performance monitoring
 */
const Image = sequelize.define("Image", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    // Original filename
    originalName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'original_name',
    },

    // R2 storage key (path in bucket)
    r2Key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'r2_key',
    },

    // Public CDN URL
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    // Image dimensions
    width: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    height: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    // File size in bytes
    size: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    // MIME type (should be image/webp after optimization)
    mimetype: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    // Category/folder for organization
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'e.g., announcements, documents, profiles',
    },

    // Optional: Reference to related entity
    relatedType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'related_type',
        comment: 'e.g., Announcement, Resident, Request',
    },

    relatedId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'related_id',
        comment: 'ID of related entity',
    },

    // Upload metadata
    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'uploaded_by',
        comment: 'User ID who uploaded',
    },

    // Soft delete
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_deleted',
    },

}, {
    tableName: 'images',
    timestamps: true,
    indexes: [
        {
            fields: ['r2_key'],
        },
        {
            fields: ['category'],
        },
        {
            fields: ['related_type', 'related_id'],
        },
        {
            fields: ['uploaded_by'],
        },
    ],
});

export default Image;
