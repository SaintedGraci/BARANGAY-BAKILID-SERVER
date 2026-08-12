import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
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

/**
 * Upload file to Cloudflare R2
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} folder - Folder path (e.g., 'documents', 'announcements')
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadToR2 = async (fileBuffer, originalName, mimetype, folder = 'documents') => {
    try {
        // Generate unique filename
        const fileExtension = originalName.split('.').pop();
        const uniqueName = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: uniqueName,
            Body: fileBuffer,
            ContentType: mimetype,
        });

        await r2Client.send(command);

        // Return public URL
        const publicUrl = `${PUBLIC_URL}/${uniqueName}`;

        console.log('✅ R2 upload successful:', publicUrl);

        return {
            url: publicUrl,
            key: uniqueName
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

export default { uploadToR2, deleteFromR2, getKeyFromUrl };
