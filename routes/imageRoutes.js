import express from 'express';
import { uploadImage, getImages, getImageById, deleteImage } from '../controllers/imageController.js';
import { uploadToR2Middleware } from '../middleware/r2UploadMiddleware.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/images/upload
 * @desc    Upload and optimize an image to Cloudflare R2
 * @access  Private (requires authentication)
 * @body    { category?, relatedType?, relatedId? }
 * @file    image file (multipart/form-data)
 */
router.post('/upload', authenticate, uploadToR2Middleware('image'), uploadImage);

/**
 * @route   GET /api/images
 * @desc    Get all images with optional filters
 * @access  Private
 * @query   { category?, relatedType?, relatedId?, limit?, offset? }
 */
router.get('/', authenticate, getImages);

/**
 * @route   GET /api/images/:id
 * @desc    Get a single image by ID
 * @access  Private
 */
router.get('/:id', authenticate, getImageById);

/**
 * @route   DELETE /api/images/:id
 * @desc    Delete an image (soft delete by default, hard delete with ?hardDelete=true)
 * @access  Private
 * @query   { hardDelete? }
 */
router.delete('/:id', authenticate, deleteImage);

export default router;
