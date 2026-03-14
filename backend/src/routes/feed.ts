import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listPosts,
  createPost,
  toggleLike,
  createReply,
  deletePost,
  deleteReply,
  getTrending,
} from '../controllers/feedController.js';

const router = Router();

// Trending must be before /:id to avoid capturing "trending" as an id
router.get('/trending', authenticate, getTrending);

router.get('/', authenticate, listPosts);
router.post('/', authenticate, createPost);

router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/replies', authenticate, createReply);
router.delete('/:id/replies/:replyId', authenticate, deleteReply);
router.delete('/:id', authenticate, deletePost);

export default router;
