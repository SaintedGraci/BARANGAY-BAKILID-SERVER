import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try Cloudinary first, fallback to local storage
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  // Log configuration status (without exposing secrets)
  logger.info('Cloudinary configuration:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✓' : '✗',
    api_key: process.env.CLOUDINARY_API_KEY ? '✓' : '✗',
    api_secret: process.env.CLOUDINARY_API_SECRET ? '✓' : '✗'
  });
} else {
  logger.info('Using local file storage (Cloudinary not configured)');
}

// Storage configuration
let storage;

if (useCloudinary) {
  // Use Cloudinary Storage
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'barangay-bakilid',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      transformation: [{ width: 1000, quality: 'auto' }],
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined
    }
  });
  logger.info('📦 Using Cloudinary storage');
} else {
  // Use Local Disk Storage
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  logger.info('💾 Using local disk storage');
}

// Create base multer upload instance
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow file even if there might be upload issues
    cb(null, true);
  }
});

// Export the upload instance (works with .single(), .fields(), etc.)
export const cloudinaryUpload = upload;

// Wrapper for registration with error handling
export const cloudinaryUploadHandler = (req, res, next) => {
  upload.fields([
    { name: 'validId', maxCount: 1 },
    { name: 'proofOfResidency', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      // Log detailed error information
      logger.error('Cloudinary upload error:', {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        http_code: err.http_code,
        name: err.name
      });
      req.files = {}; // Set empty files object
    }
    next();
  });
};

export default cloudinary;
