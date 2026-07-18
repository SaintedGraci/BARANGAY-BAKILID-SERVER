import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: path.join(__dirname, "../uploads"),
    filename: (req, file, cb) => {
        const fileName = file.originalname.split(".")[0];
        const extension = file.originalname.split(".")[1];
        const timestamp = Date.now();
        cb(null, `${fileName}-${timestamp}.${extension}`);
    }
});

// Whitelist of allowed MIME types and extensions
const ALLOWED_FILE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf']
};

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const upload = multer({ 
    storage,
    limits: { 
        fileSize: MAX_FILE_SIZE,
        files: 2 // Maximum 2 files per request (validId + proofOfResidency)
    },
    fileFilter: (req, file, cb) => {
        // Extract file extension
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype;

        // Check if MIME type is allowed
        if (!ALLOWED_FILE_TYPES[mimeType]) {
            return cb(new Error(`Invalid file type. Only JPEG, PNG, and PDF files are allowed. Received: ${mimeType}`));
        }

        // Check if extension matches the MIME type
        const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];
        if (!allowedExtensions.includes(fileExtension)) {
            return cb(new Error(`File extension ${fileExtension} does not match MIME type ${mimeType}`));
        }

        // Additional security: Check file name for suspicious patterns
        const suspiciousPatterns = /\.\.|\/|\\|%00|<|>|\|/;
        if (suspiciousPatterns.test(file.originalname)) {
            return cb(new Error('Invalid file name detected'));
        }

        // File is valid
        cb(null, true);
    }
});
