import multer from 'multer';
import { uploadToR2 } from '../config/r2.js';

// Configure multer to use memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and PDFs
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and PDF are allowed.'));
        }
    }
});

/**
 * Middleware to upload files to R2 after multer processes them
 */
export const uploadToR2Middleware = (fieldConfig) => {
    return async (req, res, next) => {
        try {
            // First, use multer to parse the files
            const multerMiddleware = Array.isArray(fieldConfig)
                ? upload.fields(fieldConfig)
                : upload.single(fieldConfig);

            multerMiddleware(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                try {
                    // Upload files to R2
                    if (req.files) {
                        // Multiple files (fields)
                        for (const [fieldName, files] of Object.entries(req.files)) {
                            const uploadedFiles = [];
                            
                            for (const file of files) {
                                const result = await uploadToR2(
                                    file.buffer,
                                    file.originalname,
                                    file.mimetype,
                                    fieldName // use field name as folder
                                );
                                
                                uploadedFiles.push({
                                    ...result,
                                    originalname: file.originalname,
                                    mimetype: file.mimetype,
                                    size: file.size
                                });
                            }
                            
                            // Replace multer files with R2 info
                            req.files[fieldName] = uploadedFiles.map(f => ({
                                ...f,
                                r2Url: f.url,
                                r2Key: f.key
                            }));
                        }
                    } else if (req.file) {
                        // Single file
                        const result = await uploadToR2(
                            req.file.buffer,
                            req.file.originalname,
                            req.file.mimetype,
                            'uploads'
                        );
                        
                        req.file.r2Url = result.url;
                        req.file.r2Key = result.key;
                    }

                    next();
                } catch (uploadError) {
                    console.error('R2 upload error:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'File upload failed',
                        error: uploadError.message
                    });
                }
            });
        } catch (error) {
            console.error('Upload middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Upload processing failed',
                error: error.message
            });
        }
    };
};

export default { uploadToR2Middleware };
