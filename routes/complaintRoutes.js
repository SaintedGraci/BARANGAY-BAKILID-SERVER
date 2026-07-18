import express from "express";
import { 
    getAllComplaints, 
    getComplaintById,
    getMyComplaints,
    createComplaint, 
    updateComplaint, 
    deleteComplaint 
} from "../controllers/complaintController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: Get all complaints (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complaints retrieved successfully
 *       403:
 *         description: Admin role required
 */
router.get("/", roleMiddleware(["admin"]), getAllComplaints);

/**
 * @swagger
 * /api/complaints/my:
 *   get:
 *     summary: Get my complaints (Resident)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Your complaints retrieved successfully
 */
router.get("/my", roleMiddleware(["resident"]), getMyComplaints);

/**
 * @swagger
 * /api/complaints/{id}:
 *   get:
 *     summary: Get complaint by ID
 *     tags: [Complaints]
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
 *         description: Complaint details
 *       404:
 *         description: Complaint not found
 */
router.get("/:id", getComplaintById);

/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: File a new complaint (Resident)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *                 example: Noise complaint
 *               description:
 *                 type: string
 *                 example: Loud music at night from neighbor
 *     responses:
 *       201:
 *         description: Complaint filed successfully
 */
router.post("/", roleMiddleware(["resident"]), createComplaint);

/**
 * @swagger
 * /api/complaints/{id}:
 *   put:
 *     summary: Update complaint status (Admin only)
 *     tags: [Complaints]
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
 *                 enum: [Pending, Investigating, Resolved]
 *     responses:
 *       200:
 *         description: Complaint updated
 *       403:
 *         description: Admin role required
 */
router.put("/:id", roleMiddleware(["admin"]), updateComplaint);

/**
 * @swagger
 * /api/complaints/{id}:
 *   delete:
 *     summary: Delete a complaint (Admin only)
 *     tags: [Complaints]
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
 *         description: Complaint deleted
 *       403:
 *         description: Admin role required
 */
router.delete("/:id", roleMiddleware(["admin"]), deleteComplaint);

export default router;
