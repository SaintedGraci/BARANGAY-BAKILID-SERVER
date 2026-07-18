import Announcement from "../models/announcement.js";

export const getAllAnnouncements = async (filters = {}) => {
    try {
        const announcements = await Announcement.findAll({ 
            where: filters,
            order: [['createdAt', 'DESC']]
        });
        return { success: true, data: announcements };
    } catch (error) {
        console.error("Get all announcements error:", error);
        return { success: false, message: "Server error" };
    }
};

export const getAnnouncementById = async (id) => {
    try {
        const announcement = await Announcement.findByPk(id);
        if (!announcement) {
            return { success: false, message: "Announcement not found" };
        }
        return { success: true, data: announcement };
    } catch (error) {
        console.error("Get announcement error:", error);
        return { success: false, message: "Server error" };
    }
};

export const createAnnouncement = async (title, description, status = "Active") => {
    try {
        // Validate input
        if (!title || !description) {
            return { success: false, message: "Missing required fields" };
        }

        // Create new announcement
        const newAnnouncement = await Announcement.create({
            title,
            description,
            status
        });

        return { success: true, data: newAnnouncement, message: "Announcement created successfully" };
    } catch (error) {
        console.error("Create announcement error:", error);
        return { success: false, message: "Server error" };
    }
};

export const updateAnnouncement = async (id, title, description, status) => {
    try {
        // Find announcement by ID
        const announcement = await Announcement.findByPk(id);
        if (!announcement) {
            return { success: false, message: "Announcement not found" };
        }

        // Update announcement
        await announcement.update({
            title: title || announcement.title,
            description: description || announcement.description,
            status: status || announcement.status
        });

        return { success: true, message: "Announcement updated successfully", data: announcement };
    } catch (error) {
        console.error("Update announcement error:", error);
        return { success: false, message: "Server error" };
    }
};

export const deleteAnnouncement = async (id) => {
    try {
        // Find announcement by ID
        const announcement = await Announcement.findByPk(id);
        if (!announcement) {
            return { success: false, message: "Announcement not found" };
        }

        // Delete announcement
        await announcement.destroy();

        return { success: true, message: "Announcement deleted successfully" };
    } catch (error) {
        console.error("Delete announcement error:", error);
        return { success: false, message: "Server error" };
    }
};