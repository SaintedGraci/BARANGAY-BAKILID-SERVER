import express from "express";
import authRoutes from "./authRoutes.js";
import residentRoutes from "./residentRoutes.js";
import requestRoutes from "./requestRoutes.js";
import complaintRoutes from "./complaintRoutes.js";
import announcementRoutes from "./announcementRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import healthRoutes from "./healthRoutes.js";
import logsRoutes from "./logsRoutes.js";

const router = express.Router();

// API Routes
router.use("/auth", authRoutes);
router.use("/residents", residentRoutes);
router.use("/requests", requestRoutes);
router.use("/complaints", complaintRoutes);
router.use("/announcements", announcementRoutes);
router.use("/notifications", notificationRoutes);
router.use("/health", healthRoutes);
router.use("/logs", logsRoutes);

export default router;
