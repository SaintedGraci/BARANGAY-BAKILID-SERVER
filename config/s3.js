import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import crypto from 'crypto';
import logger from './logger.js';

// Check if S3 credentials are configured
const isS3Configured = process.env.AWS_ACCESS_KEY_ID && 
                       process.env.AWS_SECRET_ACCESS_KEY && 
                       process.env.AWS_S3_BUCKET_NAME &&
                       process.env.AWS_REGION;

let upload;

if (isS3Configured) {
  // Initialize S3 Client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  // Configure multer-s3 storage
  const s3Storage = multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read', // Make files publicly accessible
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Generate unique filename: folder/fieldname-timestamp-random.ext
      const folder = 'barangay-bakilid';
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname);
      const filename = `${folder}/${file.fieldname}-${timestamp}-${randomString}${ext}`;
      cb(null, filename);
    }
  });

  upload = multer({
    storage: s3Storage,
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

  logger.info('☁️ AWS S3 storage configured successfully', {
    bucket: process.env.AWS_S3_BUCKET_NAME,
    region: process.env.AWS_REGION
  });
} else {
  // Fallback to local storage if S3 not configured
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  upload = multer({
    storage: localStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
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

  logger.warn('⚠️ S3 not configured, using local storage fallback');
}

// Export upload middleware
export const s3Upload = upload;

// Wrapper for registration with error handling
export const s3UploadHandler = (req, res, next) => {
  upload.fields([
    { name: 'validId', maxCount: 1 },
    { name: 'proofOfResidency', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      logger.error('File upload error:', {
        message: err.message,
        code: err.code
      });
      req.files = {}; // Continue without files on error
    }
    next();
  });
};

export { isS3Configured };
