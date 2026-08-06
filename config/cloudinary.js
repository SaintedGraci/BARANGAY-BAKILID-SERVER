import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import logger from './logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

logger.info('☁️ Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
});

// Cloudinary Storage with proper configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'barangay-bakilid',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      resource_type: 'auto',
      // Use upload preset if available (for unsigned uploads)
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  }
});

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Export for announcements (single file upload)
export const cloudinaryUpload = upload;

// Wrapper for registration with detailed error handling
export const cloudinaryUploadHandler = (req, res, next) => {
  upload.fields([
    { name: 'validId', maxCount: 1 },
    { name: 'proofOfResidency', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      logger.error('Cloudinary upload error:', {
        message: err.message,
        code: err.code,
        http_code: err.http_code,
        name: err.name
      });
      // Continue without files - don't fail registration
      req.files = {};
    }
    next();
  });
};

export default cloudinary;
