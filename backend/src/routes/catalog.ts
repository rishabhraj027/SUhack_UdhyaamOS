import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getCatalog, addCatalogItem } from '../controllers/catalogController.js';

const router = Router();

router.get('/', authenticate, getCatalog);
router.post('/', authenticate, addCatalogItem);

export default router;
