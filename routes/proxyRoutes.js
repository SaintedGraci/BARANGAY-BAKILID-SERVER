import express from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getKeyFromUrl } from '../config/r2.js';

const router = express.Router();

const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * CORS middleware for proxy routes
 */
router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

/**
 * Proxy endpoint to serve R2 images through Railway backend
 * This bypasses R2 public URL issues
 * 
 * Usage: /api/proxy/image?key=announcements/123-456.webp
 */
router.get('/image', async (req, res) => {
    try {
        const { key } = req.query;
        
        if (!key) {
            return res.status(400).json({
                success: false,
                message: 'Image key is required'
            });
        }

        // Get object from R2
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await r2Client.send(command);
        
        // Set appropriate headers
        res.setHeader('Content-Type', response.ContentType || 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        
        // Stream the image
        response.Body.pipe(res);
        
    } catch (error) {
        console.error('Proxy image error:', error);
        
        if (error.name === 'NoSuchKey') {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch image'
        });
    }
});

export default router;
