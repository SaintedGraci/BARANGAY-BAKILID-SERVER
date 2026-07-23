import express from "express";
import { 
    getAllRequests, 
    getRequestById, 
    createRequest, 
    updateRequest, 
    deleteRequest
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request deleted
 *       403:
 *         description: Admin role required
 */
router.delete("/:id", roleMiddleware(["admin"]), deleteRequest);

export default router;
