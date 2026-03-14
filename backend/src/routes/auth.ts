import { Router } from 'express';
import { register, login, googleAuth, googleAuthInit, googleAuthCallback } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// Redirect-based Google OAuth flow
router.get('/google/init', googleAuthInit);
router.get('/google/callback', googleAuthCallback);

export default router;
