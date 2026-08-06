import { createUploadthing } from "uploadthing/server";
import multer from 'multer';
import { UTApi } from "uploadthing/server";
import logger from './logger.js';

const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
});

// Initialize UploadThing
const f = createUploadthing();

// Define upload endpoints
export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 2 } })
    .middleware(async ({ req }) => {
      // You can add authentication here if needed
      return { userId: req.user?.id || "anonymous" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      logger.info("Upload complete for userId:", metadata.userId);
      logger.info("File URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
};

// Multer configuration for handling multipart form data
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Helper function to upload file to UploadThing
export async function uploadToUploadThing(fileBuffer, fileName) {
  try {
    const file = new File([fileBuffer], fileName);
    const response = await utapi.uploadFiles(file);
    
    if (response.data) {
      logger.info('✅ File uploaded to UploadThing:', response.data.url);
      return response.data.url;
    }
    
    throw new Error('Upload failed');
  } catch (error) {
    logger.error('UploadThing upload error:', error);
    throw error;
  }
}

// Middleware for registration with UploadThing
export const uploadThingHandler = (req, res, next) => {
  upload.fields([
    { name: 'validId', maxCount: 1 },
    { name: 'proofOfResidency', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      logger.error('Multer error:', err.message);
      req.files = {};
      return next();
    }

    // Upload files to UploadThing if present
    try {
      if (req.files?.validId?.[0]) {
        const url = await uploadToUploadThing(
          req.files.validId[0].buffer,
          req.files.validId[0].originalname
        );
        req.files.validId[0].uploadThingUrl = url;
      }

      if (req.files?.proofOfResidency?.[0]) {
        const url = await uploadToUploadThing(
          req.files.proofOfResidency[0].buffer,
          req.files.proofOfResidency[0].originalname
        );
        req.files.proofOfResidency[0].uploadThingUrl = url;
      }
    } catch (uploadError) {
      logger.error('UploadThing error:', uploadError.message);
      // Continue without files on error
    }

    next();
  });
};

export default utapi;
