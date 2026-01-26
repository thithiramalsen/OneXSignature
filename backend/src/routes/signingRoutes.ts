import { Router } from 'express';
import {
  signDocument,
  getSignedDocuments,
  downloadSignedDocument,
  deleteSignedDocument,
} from '../controllers/signingController';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', apiLimiter, authenticate, signDocument);
router.get('/', apiLimiter, authenticate, getSignedDocuments);
router.get('/:id/download', apiLimiter, authenticate, downloadSignedDocument);
router.delete('/:id', apiLimiter, authenticate, deleteSignedDocument);

export default router;
