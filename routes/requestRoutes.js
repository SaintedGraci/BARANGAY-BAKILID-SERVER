import express from "express";
import { 
    getAllRequests, 
    getRequestById, 
    createRequest, 
    updateRequest, 
    deleteRequest,
    sendPickupEmail,
    archiveRequest,
    getArchivedRequests,
    unarchiveRequest,
    markAsClaimed
} from "../controllers/requestContoller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get all document requests
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     description: Residents see only their own requests, staff/admin/captain see all
 *     responses:
 *       200:
 *         description: Requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Request'
 */
router.get("/", getAllRequests);

/**
 * @swagger
 * /api/requests/archives:
 *   get:
 *     summary: Get all archived requests
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     description: View archived requests with search and filter capabilities
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by resident name or document type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by claimed date (start)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by claimed date (end)
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *         description: Filter by document type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Archived requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 */
router.get("/archives", getArchivedRequests);

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get request by ID
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Request'
 *       404:
 *         description: Request not found
 */
router.get("/:id", getRequestById);

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a new document request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentType
 *               - purpose
 *             properties:
 *               documentType:
 *                 type: string
 *                 example: Barangay Clearance
 *               purpose:
 *                 type: string
 *                 example: Employment requirement
 *     responses:
 *       201:
 *         description: Request created successfully
 */
router.post("/", createRequest);

/**
 * @swagger
 * /api/requests/{id}:
 *   put:
 *     summary: Update request status
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Processing, Ready for Release, Claimed, Rejected]
 *     responses:
 *       200:
 *         description: Request updated
 *       403:
 *         description: Insufficient permissions
 */
router.put("/:id", roleMiddleware(["staff", "secretary", "admin", "captain"]), updateRequest);

/**
 * @swagger
 * /api/requests/{id}:
 *   delete:
 *     summary: Delete a request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     description: Residents can delete their own "Pending" requests. Admins can delete any request.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request deleted successfully
 *       400:
 *         description: Cannot delete non-pending requests
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Request not found
 */
router.delete("/:id", deleteRequest); // Removed role restriction - validation is done in controller

/**
 * @swagger
 * /api/requests/{id}/send-pickup-email:
 *   post:
 *     summary: Send pickup notification email for Ready for Release documents
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     description: Manually send email notification to resident when document is ready for pickup. Requires admin role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid status or email already sent
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Request not found or no email address
 */
router.post("/:id/send-pickup-email", roleMiddleware(["admin", "secretary", "captain"]), sendPickupEmail);

/**
 * @swagger
 * /api/requests/{id}/claim:
 *   post:
 *     summary: Mark request as claimed
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     description: Mark a "Ready for Release" request as claimed and automatically set claimedDate
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request marked as claimed
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Insufficient permissions
 */
router.post("/:id/claim", roleMiddleware(["admin", "secretary", "captain", "staff"]), markAsClaimed);

/**
 * @swagger
 * /api/requests/{id}/archive:
 *   post:
 *     summary: Archive a claimed request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     description: Move a claimed request to archives for record keeping. Only claimed requests can be archived.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request archived successfully
 *       400:
 *         description: Request not in claimed status or already archived
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Request not found
 */
router.post("/:id/archive", roleMiddleware(["admin", "secretary", "captain", "staff"]), archiveRequest);

/**
 * @swagger
 * /api/requests/{id}/unarchive:
 *   post:
 *     summary: Restore request from archives
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     description: Unarchive a request (admin/captain only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request restored from archives
 *       400:
 *         description: Request is not archived
 *       403:
 *         description: Insufficient permissions
 */
router.post("/:id/unarchive", roleMiddleware(["admin", "captain"]), unarchiveRequest);

export default router;
