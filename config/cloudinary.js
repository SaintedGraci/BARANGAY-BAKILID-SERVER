import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import logger from './logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'barangay-bakilid',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1000, quality: 'auto' }]
  }
});

// Create multer upload instance with error handling
export const cloudinaryUpload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow file even if there might be upload issues
    cb(null, true);
  }
}).fields([
  { name: 'validId', maxCount: 1 },
  { name: 'proofOfResidency', maxCount: 1 }
]);

// Wrapper to handle Cloudinary errors gracefully
export const cloudinaryUploadHandler = (req, res, next) => {
  cloudinaryUpload(req, res, (err) => {
    if (err) {
      // Log error but continue without files
      logger.error('Cloudinary upload error:', err.message);
      req.files = {}; // Set empty files object
    }
    next();
  });
};

export default cloudinary;
