import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createReview, getReviewsForUser } from '../controllers/reviewController.js';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/user/:userId', authenticate, getReviewsForUser);

export default router;
