import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('📁 Created uploads directory');
}

// Local Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: fieldname-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
  }
};

// Create base multer upload instance
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

logger.info('� Using Railway local disk storage for file uploads');

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
      logger.error('File upload error:', {
        message: err.message,
        code: err.code
      });
      // Continue without files on error
      req.files = {};
    }
    next();
  });
};

// No cloudinary export needed
export default null;
