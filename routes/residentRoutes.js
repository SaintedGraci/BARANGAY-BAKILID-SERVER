import express from "express";
import { 
    getAllResidents, 
    getResidentById, 
    createResident,
    createResidentWithAccount, 
    updateResident, 
    deleteResident,
    getPendingVerifications,
    approveResident,
    rejectResident
} from "../controllers/residentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/residents:
 *   get:
 *     summary: Get all residents
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: Residents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     residents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Resident'
 *                     pagination:
 *                       type: object
 *       403:
 *         description: Insufficient permissions
 */
router.get("/", roleMiddleware(["staff", "secretary", "admin", "captain"]), getAllResidents);

/**
 * @swagger
 * /api/residents/pending-verifications:
 *   get:
 *     summary: Get pending resident verifications
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending verifications retrieved
 *       403:
 *         description: Admin or captain role required
 */
router.get("/pending-verifications", roleMiddleware(["admin", "secretary", "staff", "captain"]), getPendingVerifications);

/**
 * @swagger
 * /api/residents/{id}/approve:
 *   put:
 *     summary: Approve a pending resident
 *     tags: [Residents]
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
 *         description: Resident approved
 *       403:
 *         description: Admin or captain role required
 *       404:
 *         description: Resident not found
 */
router.put("/:id/approve", roleMiddleware(["admin", "secretary", "staff", "captain"]), approveResident);

/**
 * @swagger
 * /api/residents/{id}/reject:
 *   put:
 *     summary: Reject a pending resident
 *     tags: [Residents]
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resident rejected
 *       403:
 *         description: Admin or captain role required
 */
router.put("/:id/reject", roleMiddleware(["admin", "secretary", "staff", "captain"]), rejectResident);

/**
 * @swagger
 * /api/residents/{id}:
 *   get:
 *     summary: Get resident by ID
 *     tags: [Residents]
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
 *         description: Resident details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resident'
 *       404:
 *         description: Resident not found
 */
router.get("/:id", getResidentById);

/**
 * @swagger
 * /api/residents/create-with-account:
 *   post:
 *     summary: Create resident with user account
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - birthDate
 *               - contactNumber
 *               - address
 *               - purok
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               contactNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               purok:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resident with account created
 *       403:
 *         description: Admin or captain role required
 */
router.post("/create-with-account", roleMiddleware(["admin", "secretary", "captain"]), createResidentWithAccount);

/**
 * @swagger
 * /api/residents:
 *   post:
 *     summary: Create new resident
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - birthDate
 *               - contactNumber
 *               - address
 *               - purok
 *     responses:
 *       201:
 *         description: Resident created
 *       403:
 *         description: Insufficient permissions
 */
router.post("/", roleMiddleware(["staff", "secretary", "admin", "captain"]), createResident);

/**
 * @swagger
 * /api/residents/{id}:
 *   put:
 *     summary: Update resident information
 *     tags: [Residents]
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
 *     responses:
 *       200:
 *         description: Resident updated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Resident not found
 */
router.put("/:id", roleMiddleware(["staff", "secretary", "admin", "captain"]), updateResident);

/**
 * @swagger
 * /api/residents/{id}:
 *   delete:
 *     summary: Delete a resident
 *     tags: [Residents]
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
 *         description: Resident deleted
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Resident not found
 */
router.delete("/:id", roleMiddleware(["admin"]), deleteResident);

export default router;
