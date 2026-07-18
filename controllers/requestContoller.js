import Request from "../models/request.js";
import Resident from "../models/resident.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

export const getAllRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereClause = {};
        
        // If user is a resident, only show their requests
        if (userRole === 'resident') {
            const resident = await Resident.findOne({ where: { UserId: userId } });
            if (!resident) {
                return res.status(200).json({ 
                    success: true,
                    data: [] 
                });
            }
            whereClause.ResidentId = resident.id;
        }
        // Admin, staff, and captain can see all requests

        const requests = await Request.findAll({
            where: whereClause,
            include: [{
                model: Resident,
                attributes: ['id', 'firstName', 'lastName', 'contactNumber'],
                include: [{
                    model: User,
                    attributes: ['email', 'username']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });
        
        return res.status(200).json({ 
            success: true,
            data: requests 
        });
    } catch (error) {
        console.error("Get all requests error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Failed to fetch requests",
            error: error.message 
        });
    }
};

export const getRequestById = async (req, res) => {
    const { id } = req.params;
    const request = await Request.findByPk(id);
    if (!request) {
        return res.status(404).json({ message: "Request not found" });
    }
    return res.status(200).json(request);
};

export const createRequest = async (req, res) => {
    try {
        const { documentType, purpose, remarks } = req.body;

        // Validate input
        if (!documentType || !purpose) {
            return res.status(400).json({ 
                success: false,
                message: "Document type and purpose are required" 
            });
        }

        // Get user ID from authenticated request
        const userId = req.user.id;

        // Find the resident associated with this user
        const resident = await Resident.findOne({ where: { UserId: userId } });
        
        if (!resident) {
            return res.status(404).json({ 
                success: false,
                message: "Resident profile not found. Please complete your profile first." 
            });
        }

        // Create new request
        const newRequest = await Request.create({
            documentType,
            purpose,
            remarks: remarks || null,
            status: 'Pending',
            ResidentId: resident.id
        });

        return res.status(201).json({ 
            success: true,
            message: "Request created successfully",
            data: newRequest 
        });
    } catch (error) {
        console.error("Create request error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Failed to create request",
            error: error.message 
        });
    }
};

export const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, documentType, purpose, remarks, releaseDate } = req.body;

        // Find request by ID with Resident and User data
        const request = await Request.findByPk(id, {
            include: [{
                model: Resident,
                attributes: ['id', 'firstName', 'lastName'],
                include: [{
                    model: User,
                    attributes: ['id', 'email', 'username']
                }]
            }]
        });

        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: "Request not found" 
            });
        }

        // Store old status for comparison
        const oldStatus = request.status;

        // Update request with provided fields
        const updateData = {};
        if (status) updateData.status = status;
        if (documentType) updateData.documentType = documentType;
        if (purpose) updateData.purpose = purpose;
        if (remarks !== undefined) updateData.remarks = remarks;
        if (releaseDate) updateData.releaseDate = releaseDate;

        await request.update(updateData);

        // Create notification and emit Socket.IO event if status changed
        if (status && status !== oldStatus) {
            const userId = request.Resident?.User?.id;
            
            if (userId) {
                // Save notification to database
                const notificationData = {
                    requestId: request.id,
                    documentType: request.documentType,
                    oldStatus: oldStatus,
                    newStatus: status,
                    message: `Your ${request.documentType} request status has been updated to ${status}`,
                    timestamp: new Date()
                };

                await Notification.create({
                    UserId: userId,
                    type: 'request_status_update',
                    title: 'Request Status Update',
                    message: notificationData.message,
                    data: notificationData,
                    read: false
                });

                // Emit Socket.IO notification for real-time update (if user is online)
                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${userId}`).emit('requestStatusUpdate', notificationData);
                    console.log(`🔔 Real-time notification sent to user ${userId} for request ${id}`);
                }
                
                console.log(`💾 Notification saved to database for user ${userId}`);
            }
        }

        return res.status(200).json({ 
            success: true,
            message: "Request updated successfully",
            data: request 
        });
    } catch (error) {
        console.error("Update request error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Failed to update request",
            error: error.message 
        });
    }
};

export const deleteRequest = async (req, res) => {
    const { id } = req.params;

    // Find request by ID
    const request = await Request.findByPk(id);
    if (!request) {
        return res.status(404).json({ message: "Request not found" });
    }

    // Delete request
    await request.destroy();

    return res.status(200).json({ message: "Request deleted successfully" });
};
