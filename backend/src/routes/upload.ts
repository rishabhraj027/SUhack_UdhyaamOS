import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { uploadFile } from '../controllers/uploadController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // increased to 50MB for submissions
  fileFilter: (_req, file, cb) => {
    // Allow images, pdfs, and zips
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.mimetype === 'text/plain' 
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, pdf, zip, txt'));
    }
  },
});

const router = Router();

router.post('/', authenticate, upload.single('file'), uploadFile);

export default router;
