import { Router } from 'express';
import { getMe, updateMe, getUsersByIds, getPublicProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Batch fetch (public-ish — but still requires auth)
router.get('/', authenticate, getUsersByIds);

// Current user profile
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

// Public company profile (must be after /me to avoid capturing "me" as :userId)
router.get('/:userId/profile', authenticate, getPublicProfile);

export default router;
