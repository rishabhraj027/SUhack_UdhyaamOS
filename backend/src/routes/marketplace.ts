import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getMarketplace, createListing, deleteListing } from '../controllers/marketplaceController.js';

const router = Router();

router.get('/', authenticate, getMarketplace);
router.post('/', authenticate, createListing);
router.delete('/:id', authenticate, deleteListing);

export default router;
