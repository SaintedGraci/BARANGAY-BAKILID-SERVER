import Announcement from "../models/announcement.js";
import fs from "fs";
import path from "path";

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

        console.log('📝 Create Announcement Request:');
        console.log('  - Body:', { title, description, status, priority, expiryDate });
        console.log('  - File:', req.file ? `${req.file.filename} (${req.file.size} bytes)` : 'No file');

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

        // Add image path if file was uploaded
        if (req.file) {
            // Save only relative path (uploads/filename.ext)
            announcementData.imagePath = `uploads/${req.file.filename}`;
            console.log('  ✅ Image path saved:', announcementData.imagePath);
        }

        const newAnnouncement = await Announcement.create(announcementData);
        console.log('  ✅ Announcement created with ID:', newAnnouncement.id);

        return res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            data: newAnnouncement,
        });
    } catch (error) {
        console.error("Create announcement error:", error);
        // Clean up uploaded file if error occurs
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
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

        // Handle image update
        if (req.file) {
            // Delete old image if exists
            if (announcement.imagePath) {
                try {
                    // Construct full path for deletion
                    const fullPath = announcement.imagePath.startsWith('uploads/') 
                        ? announcement.imagePath 
                        : announcement.imagePath;
                    fs.unlinkSync(fullPath);
                } catch (err) {
                    console.error("Error deleting old image:", err);
                }
            }
            // Save only relative path (uploads/filename.ext)
            updateData.imagePath = `uploads/${req.file.filename}`;
        }

        await announcement.update(updateData);

        return res.status(200).json({
            success: true,
            message: "Announcement updated successfully",
            data: announcement,
        });
    } catch (error) {
        console.error("Update announcement error:", error);
        // Clean up uploaded file if error occurs
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
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

        // Delete associated image if exists
        if (announcement.imagePath) {
            try {
                // Handle both old full paths and new relative paths
                const imagePath = announcement.imagePath.startsWith('uploads/') 
                    ? announcement.imagePath 
                    : announcement.imagePath;
                fs.unlinkSync(imagePath);
            } catch (err) {
                console.error("Error deleting image:", err);
            }
        }

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
