import Announcement from "../models/announcement.js";
import { uploadToImgBB } from "../config/imgbb.js";
import logger from "../config/logger.js";

export const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.findAll({
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            data: announcements,
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
        const { title, description, status, priority, expiryDate } = req.body;

        logger.info('📝 Create Announcement Request:', { title, description, status, priority, expiryDate });
        logger.info('  - File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        const announcementData = {
            title,
            description,
            status: status || "Active",
            priority: priority || "Medium",
            expiryDate: expiryDate || null,
        };

        // Get R2 URL if file present
        if (req.file && req.file.r2Url) {
            announcementData.imagePath = req.file.r2Url;
            logger.info('  ✅ Image uploaded to R2:', req.file.r2Url);
        }

        const newAnnouncement = await Announcement.create(announcementData);
        logger.info('  ✅ Announcement created with ID:', newAnnouncement.id);

        return res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            data: newAnnouncement,
        });
    } catch (error) {
        logger.error("Create announcement error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, expiryDate } = req.body;

        const announcement = await Announcement.findByPk(id);
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        const updateData = {
            title: title ?? announcement.title,
            description: description ?? announcement.description,
            status: status ?? announcement.status,
            priority: priority ?? announcement.priority,
            expiryDate: expiryDate ?? announcement.expiryDate,
        };

        // Get R2 URL if new file uploaded
        if (req.file && req.file.r2Url) {
            updateData.imagePath = req.file.r2Url;
            logger.info('  ✅ Image updated on R2:', req.file.r2Url);
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
