import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (no disk write)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'application/pdf',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload images (JPG, PNG, etc.) or PDF files.`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  },
  fileFilter
});

// Middleware for single file upload
export const uploadSingle = upload.single('document');

// Middleware for multiple files upload
export const uploadMultiple = upload.array('documents', 5);

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large',
        message: 'File size must be less than 10MB' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files',
        message: 'Maximum 5 files allowed per upload' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Unexpected file field',
        message: 'Please use "documents" field for file uploads' 
      });
    }
  }
  
  if (error.message.includes('Unsupported file type')) {
    return res.status(400).json({ 
      error: 'Unsupported file type',
      message: error.message 
    });
  }
  
  return res.status(500).json({ 
    error: 'File upload error',
    message: 'An error occurred during file upload' 
  });
};