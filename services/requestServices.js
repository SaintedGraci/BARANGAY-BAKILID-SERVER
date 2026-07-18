import Request from "../models/request.js";
import Resident from "../models/resident.js";

export const getAllRequests = async (filters = {}) => {
    try {
        const requests = await Request.findAll({ 
            where: filters,
            include: [{
                model: Resident,
                attributes: ['firstName', 'lastName', 'contactNumber']
            }],
            order: [['createdAt', 'DESC']]
        });
        return { success: true, data: requests };
    } catch (error) {
        console.error("Get all requests error:", error);
        return { success: false, message: "Server error" };
    }
};

export const getRequestById = async (id) => {
    try {
        const request = await Request.findByPk(id, {
            include: [{
                model: Resident,
                attributes: ['firstName', 'lastName', 'contactNumber', 'address']
            }]
        });
        
        if (!request) {
            return { success: false, message: "Request not found" };
        }
        
        return { success: true, data: request };
    } catch (error) {
        console.error("Get request error:", error);
        return { success: false, message: "Server error" };
    }
};

export const createRequest = async (documentType, purpose, remarks, releaseDate, residentId) => {
    try {
        // Validate input
        if (!documentType || !purpose) {
            return { success: false, message: "Missing required fields" };
        }

        // Verify resident exists
        const resident = await Resident.findByPk(residentId);
        if (!resident) {
            return { success: false, message: "Resident not found" };
        }

        // Create new request
        const newRequest = await Request.create({
            documentType,
            purpose,
            remarks,
            releaseDate,
            ResidentId: residentId,
            status: "Pending"
        });

        return { success: true, data: newRequest, message: "Request created successfully" };
    } catch (error) {
        console.error("Create request error:", error);
        return { success: false, message: "Server error" };
    }
};

export const updateRequestStatus = async (id, status, remarks) => {
    try {
        // Find request by ID
        const request = await Request.findByPk(id);
        if (!request) {
            return { success: false, message: "Request not found" };
        }

        // Update request
        await request.update({
            status,
            remarks: remarks || request.remarks
        });

        return { success: true, message: "Request status updated successfully", data: request };
    } catch (error) {
        console.error("Update request error:", error);
        return { success: false, message: "Server error" };
    }
};

export const updateRequest = async (id, documentType, purpose, remarks, releaseDate) => {
    try {
        // Find request by ID
        const request = await Request.findByPk(id);
        if (!request) {
            return { success: false, message: "Request not found" };
        }

        // Update request
        await request.update({
            documentType,
            purpose,
            remarks,
            releaseDate
        });

        return { success: true, message: "Request updated successfully", data: request };
    } catch (error) {
        console.error("Update request error:", error);
        return { success: false, message: "Server error" };
    }
};

export const deleteRequest = async (id) => {
    try {
        // Find request by ID
        const request = await Request.findByPk(id);
        if (!request) {
            return { success: false, message: "Request not found" };
        }

        // Delete request
        await request.destroy();

        return { success: true, message: "Request deleted successfully" };
    } catch (error) {
        console.error("Delete request error:", error);
        return { success: false, message: "Server error" };
    }
};