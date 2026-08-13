import Image from "../models/image.js";
import { uploadToR2, deleteFromR2 } from "../config/r2.js";
import logger from "../config/logger.js";

/**
 * Upload a single optimized image to R2 and save metadata to database
 */
export const uploadImage = async (req, res) => {
    try {
        const { category, relatedType, relatedId } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided",
            });
        }

        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: "File must be an image",
            });
        }

        const uploadResult = await uploadToR2(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            category || 'uploads',
            true
        );

        const imageRecord = await Image.create({
            originalName: req.file.originalname,
            r2Key: uploadResult.key,
            url: uploadResult.url,
            width: uploadResult.width,
            height: uploadResult.height,
            size: uploadResult.size,
            mimetype: 'image/webp',
            category: category || null,
            relatedType: relatedType || null,
            relatedId: relatedId ? parseInt(relatedId) : null,
            uploadedBy: req.user?.id || null,
        });

        logger.info('Image uploaded:', { id: imageRecord.id, url: uploadResult.url });

        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            data: {
                id: imageRecord.id,
                url: imageRecord.url,
                width: imageRecord.width,
                height: imageRecord.height,
                size: imageRecord.size,
            },
        });
    } catch (error) {
        logger.error("Upload image error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to upload image",
            error: error.message,
        });
    }
};

export const getImages = async (req, res) => {
    try {
        const { category, relatedType, relatedId, limit = 50, offset = 0 } = req.query;

        const where = { isDeleted: false };
        if (category) where.category = category;
        if (relatedType) where.relatedType = relatedType;
        if (relatedId) where.relatedId = parseInt(relatedId);

        const images = await Image.findAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            success: true,
            data: images,
            count: images.length,
        });
    } catch (error) {
        logger.error("Get images error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch images",
        });
    }
};

export const getImageById = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await Image.findOne({ where: { id, isDeleted: false } });

        if (!image) {
            return res.status(404).json({ success: false, message: "Image not found" });
        }

        return res.status(200).json({ success: true, data: image });
    } catch (error) {
        logger.error("Get image by ID error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch image" });
    }
};

export const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { hardDelete = false } = req.query;
        const image = await Image.findByPk(id);

        if (!image) {
            return res.status(404).json({ success: false, message: "Image not found" });
        }

        if (hardDelete === 'true') {
            try {
                await deleteFromR2(image.r2Key);
            } catch (r2Error) {
                logger.warn('R2 deletion warning:', r2Error.message);
            }
            await image.destroy();
            logger.info('Image hard deleted:', { id });
            return res.status(200).json({ success: true, message: "Image permanently deleted" });
        } else {
            await image.update({ isDeleted: true });
            logger.info('Image soft deleted:', { id });
            return res.status(200).json({ success: true, message: "Image deleted successfully" });
        }
    } catch (error) {
        logger.error("Delete image error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete image" });
    }
};
