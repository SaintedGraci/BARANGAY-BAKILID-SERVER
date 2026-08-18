import express from "express";
import multer from "multer";
import { 
    getAllAnnouncements, 
    getAnnouncementById, 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement,
    togglePinAnnouncement,
    archiveAnnouncement,
    toggleReaction,
    getReactions,
    addComment,
    getComments,
    deleteComment
} from "../controllers/announcementController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { cacheShort } from "../middleware/cacheMiddleware.js";

// Multer configuration for memory storage (no disk writes)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images allowed.'));
        }
    }
});

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
router.get("/", cacheShort, getAllAnnouncements);

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

/**
 * @swagger
 * /api/announcements/{id}/pin:
 *   patch:
 *     summary: Toggle pin status of an announcement
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
 *         description: Pin status toggled
 *       403:
 *         description: Captain, Secretary, or Admin only
 */
router.patch("/:id/pin", roleMiddleware(["admin", "captain", "secretary"]), togglePinAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}/archive:
 *   patch:
 *     summary: Archive an announcement
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
 *         description: Announcement archived
 *       403:
 *         description: Captain, Secretary, or Admin only
 */
router.patch("/:id/archive", roleMiddleware(["admin", "captain", "secretary"]), archiveAnnouncement);

// Reactions and comments routes - MUST come before /:id route to avoid conflicts
/**
 * @swagger
 * /api/announcements/{id}/reactions:
 *   get:
 *     summary: Get reactions for announcement
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reactions retrieved
 */
router.get("/:id/reactions", getReactions);

/**
 * @swagger
 * /api/announcements/{id}/comments:
 *   get:
 *     summary: Get comments for announcement
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comments retrieved
 */
router.get("/:id/comments", getComments);

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
router.get("/:id", cacheShort, getAnnouncementById);

// Protected routes - require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/announcements/{id}/react:
 *   post:
 *     summary: Toggle reaction on announcement
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
 *         description: Reaction toggled
 */
router.post("/:id/react", toggleReaction);

/**
 * @swagger
 * /api/announcements/{id}/comments:
 *   post:
 *     summary: Add comment to announcement
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post("/:id/comments", addComment);

/**
 * @swagger
 * /api/announcements/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.delete("/:id/comments/:commentId", deleteComment);

export default router;
