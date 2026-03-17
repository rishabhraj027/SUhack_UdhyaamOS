import { Request, Response } from 'express';
import { uploadToS3 } from '../services/s3.js';

/**
 * POST /api/upload
 * Accepts multipart form data with a single file field named "file".
 * Query param: ?folder=avatars|submissions|screenshots (default: "uploads")
 * Returns: { url: string }
 */
export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const folder = (req.query.folder as string) || 'uploads';
    // Allow dynamic folder names based on needs (avatars, submissions, documents, etc.)
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';

    const url = await uploadToS3(file.buffer, file.originalname, safeFolder, file.mimetype);
    res.json({ url });
  } catch (err) {
    console.error('[uploadFile]', err);
    res.status(500).json({ error: 'Upload failed' });
  }
}
