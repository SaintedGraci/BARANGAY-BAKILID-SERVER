import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

// Cloudflare R2 Configuration (S3-compatible)
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT?.trim(),
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim(),
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim(),
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim() || 'barangay-bakilid-documents';
const PUBLIC_URL = process.env.R2_PUBLIC_URL?.trim() || 'https://pub-ccad0830e7364a25afd38860dbe7d923.r2.dev';

// Image optimization settings
const IMAGE_MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;

/**
 * Optimize image buffer using sharp
 * - Resize to max width of 1200px (maintains aspect ratio, doesn't enlarge)
 * - Convert to WebP format at 80% quality
 * @param {Buffer} buffer - Original image buffer
 * @returns {Promise<{buffer: Buffer, width: number, height: number}>}
 */
export const optimizeImage = async (buffer) => {
    try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Only resize if image is wider than max width
        let resizedImage = image;
        if (metadata.width > IMAGE_MAX_WIDTH) {
            resizedImage = image.resize(IMAGE_MAX_WIDTH, null, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        // Convert to WebP with quality setting
        const optimizedBuffer = await resizedImage
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();

        const optimizedMetadata = await sharp(optimizedBuffer).metadata();

        console.log(`📸 Image optimized: ${metadata.width}x${metadata.height} (${(buffer.length / 1024).toFixed(2)}KB) → ${optimizedMetadata.width}x${optimizedMetadata.height} (${(optimizedBuffer.length / 1024).toFixed(2)}KB)`);

        return {
            buffer: optimizedBuffer,
            width: optimizedMetadata.width,
            height: optimizedMetadata.height,
        };
    } catch (error) {
        console.error('❌ Image optimization error:', error);
        throw new Error(`Image optimization failed: ${error.message}`);
    }
};

/**
 * Check if file is an image based on mimetype
 * @param {string} mimetype - File MIME type
 * @returns {boolean}
 */
export const isImage = (mimetype) => {
    return mimetype && mimetype.startsWith('image/');
};

/**
 * Upload file to Cloudflare R2 with automatic image optimization
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} folder - Folder path (e.g., 'documents', 'announcements')
 * @param {boolean} optimize - Whether to optimize images (default: true)
 * @returns {Promise<{url: string, key: string, width?: number, height?: number, size: number}>}
 */
export const uploadToR2 = async (fileBuffer, originalName, mimetype, folder = 'documents', optimize = true) => {
    try {
        let uploadBuffer = fileBuffer;
        let finalMimetype = mimetype;
        let fileExtension = originalName.split('.').pop();
        let imageMetadata = {};

        // Optimize images automatically
        if (optimize && isImage(mimetype)) {
            const optimized = await optimizeImage(fileBuffer);
            uploadBuffer = optimized.buffer;
            finalMimetype = 'image/webp';
            fileExtension = 'webp';
            imageMetadata = {
                width: optimized.width,
                height: optimized.height,
            };
        }

        // Generate unique filename
        const uniqueName = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: uniqueName,
            Body: uploadBuffer,
            ContentType: finalMimetype,
            // Cache control for optimal edge caching (1 year)
            CacheControl: 'public, max-age=31536000, immutable',
        });

        await r2Client.send(command);

        // Return public URL
        const publicUrl = `${PUBLIC_URL}/${uniqueName}`;

        console.log('✅ R2 upload successful:', publicUrl);

        return {
            url: publicUrl,
            key: uniqueName,
            size: uploadBuffer.length,
            ...imageMetadata,
        };
    } catch (error) {
        console.error('❌ R2 upload error:', error);
        throw new Error(`R2 upload failed: ${error.message}`);
    }
};

/**
 * Delete file from Cloudflare R2
 * @param {string} key - File key/path in R2
 * @returns {Promise<boolean>}
 */
export const deleteFromR2 = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await r2Client.send(command);
        console.log('✅ R2 delete successful:', key);
        return true;
    } catch (error) {
        console.error('❌ R2 delete error:', error);
        throw new Error(`R2 delete failed: ${error.message}`);
    }
};

/**
 * Extract R2 key from public URL
 * @param {string} url - Public URL
 * @returns {string} - File key
 */
export const getKeyFromUrl = (url) => {
    if (!url) return null;
    return url.replace(`${PUBLIC_URL}/`, '');
};

/**
 * Test R2 connection by attempting to list bucket contents
 * @returns {Promise<boolean>}
 */
export const testR2Connection = async () => {
    try {
        const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            MaxKeys: 1,
        });

        await r2Client.send(command);
        console.log('✅ R2 connection test successful');
        return true;
    } catch (error) {
        console.error('❌ R2 connection test failed:', error.message);
        return false;
    }
};

export default { uploadToR2, deleteFromR2, getKeyFromUrl, optimizeImage, testR2Connection };
