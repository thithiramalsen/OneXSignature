import { Router } from 'express';
import { uploadSignature, getSignatures, deleteSignature } from '../controllers/signatureController';
import { authenticate } from '../middleware/auth';
import { uploadSignature as uploadMiddleware } from '../middleware/upload';

const router = Router();

router.post('/', authenticate, uploadMiddleware.single('signature'), uploadSignature);
router.get('/', authenticate, getSignatures);
router.delete('/:id', authenticate, deleteSignature);

export default router;
