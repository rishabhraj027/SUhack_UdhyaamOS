import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNegotiations, createNegotiation, respondNegotiation } from '../controllers/negotiationController.js';

const router = Router();

router.get('/', authenticate, getNegotiations);
router.post('/', authenticate, createNegotiation);
router.put('/:id/respond', authenticate, respondNegotiation);

export default router;
