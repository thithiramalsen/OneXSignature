import { Router } from 'express';
import { uploadSignature, getSignatures, deleteSignature } from '../controllers/signatureController';
import { authenticate } from '../middleware/auth';
import { uploadSignature as uploadMiddleware } from '../middleware/upload';
import { uploadLimiter, apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', uploadLimiter, authenticate, uploadMiddleware.single('signature'), uploadSignature);
router.get('/', apiLimiter, authenticate, getSignatures);
router.delete('/:id', apiLimiter, authenticate, deleteSignature);

export default router;
