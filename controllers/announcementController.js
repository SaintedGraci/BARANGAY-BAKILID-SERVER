import Announcement from "../models/announcement.js";
import Image from "../models/image.js";
import { uploadImageWithVariants } from "../config/r2.js";
import { convertObjectUrls } from "../utils/imageProxy.js";
import logger from "../config/logger.js";

export const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.findAll({
            order: [["createdAt", "DESC"]],
        });

        // Convert R2 URLs to proxy URLs to bypass DNS issues
        const convertedAnnouncements = announcements.map(ann => {
            const plain = ann.get({ plain: true });
            return convertObjectUrls(plain);
        });

        return res.status(200).json({
            success: true,
            data: convertedAnnouncements,
        });
    } catch (error) {
        console.error("Get announcements error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByPk(id);

        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        return res.status(200).json({
            success: true,
            data: announcement,
        });
    } catch (error) {
        console.error("Get announcement error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const createAnnouncement = async (req, res) => {
    try {
        const { title, description, status, category, expiryDate } = req.body;

        logger.info('📝 Create Announcement Request:', { title, description, status, category, expiryDate });
        logger.info('  - File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        const announcementData = {
            title,
            description,
            status: status || "Active",
            category: category || "General",
            expiryDate: expiryDate || null,
            isPinned: false,
        };

        // Upload image with variants (thumbnail, medium, large) for responsive loading
        if (req.file && req.file.buffer) {
            try {
                const variants = await uploadImageWithVariants(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'announcements',
                    ['thumbnail', 'medium', 'large']
                );

                // Store all variant URLs
                announcementData.imagePath = variants.large; // Legacy field - use large as default
                announcementData.thumbnailUrl = variants.thumbnail;
                announcementData.mediumUrl = variants.medium;
                announcementData.largeUrl = variants.large;

                logger.info('  ✅ Image variants uploaded:', {
                    thumbnail: variants.thumbnail,
                    medium: variants.medium,
                    large: variants.large
                });
            } catch (uploadError) {
                logger.error('  ❌ Image upload failed:', uploadError.message);
                // Continue without image rather than failing the whole announcement
            }
        }

        const newAnnouncement = await Announcement.create(announcementData);
        logger.info('  ✅ Announcement created with ID:', newAnnouncement.id);

        // Save image metadata to images table
        if (req.file && announcementData.mediumUrl) {
            try {
                const variants = [
                    { size: 'thumbnail', url: announcementData.thumbnailUrl },
                    { size: 'medium', url: announcementData.mediumUrl },
                    { size: 'large', url: announcementData.largeUrl }
                ];

                for (const variant of variants) {
                    const r2Key = variant.url.replace(process.env.R2_PUBLIC_URL + '/', '');
                    await Image.create({
                        originalName: `${req.file.originalname}-${variant.size}`,
                        r2Key: r2Key,
                        url: variant.url,
                        size: req.file.size,
                        mimetype: 'image/webp',
                        category: 'announcements',
                        relatedType: 'Announcement',
                        relatedId: newAnnouncement.id,
                        uploadedBy: req.user?.id || null,
                    });
                }
                logger.info('  ✅ Image metadata saved to database');
            } catch (dbError) {
                logger.warn('  ⚠️ Failed to save image metadata:', dbError.message);
            }
        }

        return res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            data: newAnnouncement,
        });
    } catch (error) {
        logger.error("Create announcement error:", error);
        logger.error("Error details:", {
            message: error.message,
            stack: error.stack,
            sql: error.sql,
            original: error.original
        });
        return res.status(500).json({ 
            message: "Server error", 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, category, expiryDate } = req.body;

        const announcement = await Announcement.findByPk(id);
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        const updateData = {
            title: title ?? announcement.title,
            description: description ?? announcement.description,
            status: status ?? announcement.status,
            category: category ?? announcement.category,
            expiryDate: expiryDate ?? announcement.expiryDate,
        };

        // Upload new image variants if new file uploaded
        if (req.file && req.file.buffer) {
            try {
                const variants = await uploadImageWithVariants(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'announcements',
                    ['thumbnail', 'medium', 'large']
                );

                updateData.imagePath = variants.large;
                updateData.thumbnailUrl = variants.thumbnail;
                updateData.mediumUrl = variants.medium;
                updateData.largeUrl = variants.large;

                logger.info('  ✅ Image variants updated:', {
                    thumbnail: variants.thumbnail,
                    medium: variants.medium,
                    large: variants.large
                });
            } catch (uploadError) {
                logger.error('  ❌ Image upload failed:', uploadError.message);
            }
        }

        await announcement.update(updateData);

        return res.status(200).json({
            success: true,
            message: "Announcement updated successfully",
            data: announcement,
        });
    } catch (error) {
        logger.error("Update announcement error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findByPk(id);
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        // Delete from database (Cloudinary files can stay)
        await announcement.destroy();

        return res.status(200).json({
            success: true,
            message: "Announcement deleted successfully",
        });
    } catch (error) {
        console.error("Delete announcement error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const togglePinAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findByPk(id);
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        // Toggle pin status
        announcement.isPinned = !announcement.isPinned;
        await announcement.save();

        return res.status(200).json({
            success: true,
            message: announcement.isPinned ? "Announcement pinned successfully" : "Announcement unpinned successfully",
            data: announcement,
        });
    } catch (error) {
        logger.error("Toggle pin announcement error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const archiveAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findByPk(id);
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        // Update status to Archived
        announcement.status = "Archived";
        await announcement.save();

        return res.status(200).json({
            success: true,
            message: "Announcement archived successfully",
            data: announcement,
        });
    } catch (error) {
        logger.error("Archive announcement error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
