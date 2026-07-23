import express from "express";
import { 
    getAllAnnouncements, 
    getAnnouncementById, 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement 
} from "../controllers/announcementController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     security: []
 *     responses:
 *       200:
 *         description: Announcements retrieved successfully
 */
router.get("/", getAllAnnouncements);

/**
 * @swagger
 * /api/announcements/{id}:
 *   get:
 *     summary: Get announcement by ID
 *     tags: [Announcements]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Announcement details
 *       404:
 *         description: Announcement not found
 */
router.get("/:id", getAnnouncementById);

// Protected routes - require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Community Meeting
 *               content:
 *                 type: string
 *                 example: Monthly community meeting on Saturday
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *     responses:
 *       201:
 *         description: Announcement created
 *       403:
 *         description: Insufficient permissions (Captain, Secretary, or Admin only)
 */
router.post("/", roleMiddleware(["admin", "captain", "secretary"]), upload.single('image'), createAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 *   put:
 *     summary: Update an announcement
 *     tags: [Announcements]
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
 *         description: Announcement updated
 *       403:
 *         description: Insufficient permissions (Captain, Secretary, or Admin only)
 */
router.put("/:id", roleMiddleware(["admin", "captain", "secretary"]), upload.single('image'), updateAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcements]
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
 *         description: Announcement deleted
 *       403:
 *         description: Admin or Captain role required
 */
router.delete("/:id", roleMiddleware(["admin", "captain"]), deleteAnnouncement);

export default router;
