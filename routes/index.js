import express from "express";
import authRoutes from "./authRoutes.js";
import residentRoutes from "./residentRoutes.js";
import requestRoutes from "./requestRoutes.js";
import complaintRoutes from "./complaintRoutes.js";
import announcementRoutes from "./announcementRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import emailVerificationRoutes from "./emailVerificationRoutes.js";
import healthRoutes from "./healthRoutes.js";
import logsRoutes from "./logsRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import userManagementRoutes from "./userManagementRoutes.js";
import superadminRoutes from "./superadminRoutes.js";
import seedRoutes from "./seedRoutes.js";
import imageRoutes from "./imageRoutes.js";
import weatherRoutes from "./weatherRoutes.js";
import proxyRoutes from "./proxyRoutes.js";

const router = express.Router();

// API Routes
router.use("/auth", authRoutes);
router.use("/residents", residentRoutes);
router.use("/requests", requestRoutes);
router.use("/complaints", complaintRoutes);
router.use("/announcements", announcementRoutes);
router.use("/notifications", notificationRoutes);
router.use("/email-verification", emailVerificationRoutes);
router.use("/health", healthRoutes);
router.use("/logs", logsRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin/users", userManagementRoutes);
router.use("/superadmin", superadminRoutes); // Superadmin system control and configuration (TASK15)
router.use("/seed", seedRoutes); // One-time seed endpoint
router.use("/images", imageRoutes); // Image optimization and management
router.use("/weather", weatherRoutes); // Weather widget data
router.use("/proxy", proxyRoutes); // R2 image proxy (bypass R2 public URL issues)

export default router;
