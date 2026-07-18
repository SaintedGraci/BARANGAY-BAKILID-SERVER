import Complaint from "../models/complaint.js";
import Resident from "../models/resident.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import { APIResponse } from "../utils/apiResponse.js";
import logger from "../config/logger.js";

export const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.findAll({
            include: [{
                model: Resident,
                attributes: ['id', 'firstName', 'lastName', 'purok']
            }],
            order: [['createdAt', 'DESC']]
        });
        return APIResponse.success(res, complaints, "Complaints retrieved successfully");
    } catch (error) {
        logger.error('Get all complaints error:', error);
        return APIResponse.serverError(res, "Failed to retrieve complaints", error);
    }
};

export const getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findByPk(id, {
            include: [{
                model: Resident,
                attributes: ['id', 'firstName', 'lastName', 'contactNumber', 'address', 'purok']
            }]
        });
        
        if (!complaint) {
            return APIResponse.notFound(res, "Complaint not found");
        }
        
        return APIResponse.success(res, complaint, "Complaint details retrieved");
    } catch (error) {
        logger.error('Get complaint by ID error:', error);
        return APIResponse.serverError(res, "Failed to retrieve complaint", error);
    }
};

export const getMyComplaints = async (req, res) => {
    try {
        // Get resident record for current user
        const resident = await Resident.findOne({
            where: { userId: req.user.id }
        });

        if (!resident) {
            return APIResponse.notFound(res, "Resident profile not found");
        }

        const complaints = await Complaint.findAll({
            where: { ResidentId: resident.id },
            order: [['createdAt', 'DESC']]
        });

        return APIResponse.success(res, complaints, "Your complaints retrieved successfully");
    } catch (error) {
        logger.error('Get my complaints error:', error);
        return APIResponse.serverError(res, "Failed to retrieve your complaints", error);
    }
};

export const createComplaint = async (req, res) => {
    try {
        const { subject, description } = req.body;

        // Validate input
        if (!subject || !description) {
            return APIResponse.validationError(res, [
                { field: 'subject', message: 'Subject is required' },
                { field: 'description', message: 'Description is required' }
            ]);
        }

        // Get resident record for current user
        const resident = await Resident.findOne({
            where: { userId: req.user.id }
        });

        if (!resident) {
            return APIResponse.notFound(res, "Resident profile not found. Please complete your profile first.");
        }

        // Create new complaint with default "Pending" status
        const newComplaint = await Complaint.create({
            subject,
            description,
            status: "Pending",
            ResidentId: resident.id
        });

        // Notify all admins about new complaint
        const admins = await User.findAll({
            where: { role: 'admin' }
        });

        const io = req.app.get('io');
        for (const admin of admins) {
            await Notification.create({
                UserId: admin.id,
                type: 'complaint_new',
                title: 'New Complaint Filed',
                message: `${resident.firstName} ${resident.lastName} filed a complaint: ${subject}`,
                relatedId: newComplaint.id,
                relatedType: 'complaint'
            });

            // Emit real-time notification
            if (io) {
                io.to(`user_${admin.id}`).emit('notification', {
                    type: 'complaint_new',
                    title: 'New Complaint Filed',
                    message: `${resident.firstName} ${resident.lastName} filed a complaint: ${subject}`
                });
            }
        }

        logger.info(`New complaint filed by resident ${resident.id}: ${subject}`);
        return APIResponse.created(res, newComplaint, "Complaint submitted successfully");
    } catch (error) {
        logger.error('Create complaint error:', error);
        return APIResponse.serverError(res, "Failed to submit complaint", error);
    }
};

export const updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ["Pending", "Investigating", "Resolved"];
        if (!validStatuses.includes(status)) {
            return APIResponse.validationError(res, [
                { field: 'status', message: 'Invalid status value. Must be Pending, Investigating, or Resolved' }
            ]);
        }

        // Find complaint by ID
        const complaint = await Complaint.findByPk(id, {
            include: [{
                model: Resident,
                include: [{ model: User }]
            }]
        });

        if (!complaint) {
            return APIResponse.notFound(res, "Complaint not found");
        }

        const oldStatus = complaint.status;

        // Update complaint status
        await complaint.update({ status });

        // Notify resident about status change
        if (complaint.Resident && complaint.Resident.User) {
            await Notification.create({
                UserId: complaint.Resident.User.id,
                type: 'complaint_update',
                title: 'Complaint Status Updated',
                message: `Your complaint "${complaint.subject}" status changed from ${oldStatus} to ${status}`,
                relatedId: complaint.id,
                relatedType: 'complaint'
            });

            // Emit real-time notification
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${complaint.Resident.User.id}`).emit('notification', {
                    type: 'complaint_update',
                    title: 'Complaint Status Updated',
                    message: `Your complaint "${complaint.subject}" status changed from ${oldStatus} to ${status}`
                });
            }
        }

        logger.info(`Complaint ${id} status updated from ${oldStatus} to ${status}`);
        return APIResponse.success(res, complaint, "Complaint updated successfully");
    } catch (error) {
        logger.error('Update complaint error:', error);
        return APIResponse.serverError(res, "Failed to update complaint", error);
    }
};

export const deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;

        // Find complaint by ID
        const complaint = await Complaint.findByPk(id);
        if (!complaint) {
            return APIResponse.notFound(res, "Complaint not found");
        }

        // Delete complaint
        await complaint.destroy();

        logger.info(`Complaint ${id} deleted`);
        return APIResponse.success(res, null, "Complaint deleted successfully");
    } catch (error) {
        logger.error('Delete complaint error:', error);
        return APIResponse.serverError(res, "Failed to delete complaint", error);
    }
};
