import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import logger from './logger.js';

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

// Helper function to upload file to ImgBB
export async function uploadToImgBB(fileBuffer, fileName) {
  try {
    const apiKey = process.env.IMGBB_API_KEY;
    
    if (!apiKey) {
      throw new Error('IMGBB_API_KEY not configured');
    }

    const formData = new FormData();
    formData.append('image', fileBuffer.toString('base64'));
    formData.append('name', fileName);

    // API key goes in URL, not form data
    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000 // 30 seconds
    });

    if (response.data && response.data.data && response.data.data.url) {
      logger.info('✅ File uploaded to ImgBB:', response.data.data.url);
      return response.data.data.url;
    }

    throw new Error('Upload failed - no URL returned');
  } catch (error) {
    logger.error('ImgBB upload error:', {
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
}

// Middleware for registration with ImgBB
export const imgbbUploadHandler = (req, res, next) => {
  upload.fields([
    { name: 'validId', maxCount: 1 },
    { name: 'proofOfResidency', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      logger.error('Multer error:', err.message);
      req.files = {};
      return next();
    }

    // Upload files to ImgBB if present
    try {
      if (req.files?.validId?.[0]) {
        const url = await uploadToImgBB(
          req.files.validId[0].buffer,
          req.files.validId[0].originalname
        );
        req.files.validId[0].imgbbUrl = url;
      }

      if (req.files?.proofOfResidency?.[0]) {
        const url = await uploadToImgBB(
          req.files.proofOfResidency[0].buffer,
          req.files.proofOfResidency[0].originalname
        );
        req.files.proofOfResidency[0].imgbbUrl = url;
      }
    } catch (uploadError) {
      logger.error('ImgBB upload error:', uploadError.message);
      // Continue without files on error
    }

    next();
  });
};
