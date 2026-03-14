import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listConversations, getMessages, sendMessage } from '../controllers/chatController.js';

const router = Router();

router.get('/', authenticate, listConversations);
router.get('/:id/messages', authenticate, getMessages);
router.post('/:id/messages', authenticate, sendMessage);

export default router;
