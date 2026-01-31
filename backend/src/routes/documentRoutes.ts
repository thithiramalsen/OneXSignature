import { Router } from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  downloadDocument,
} from '../controllers/documentController';
import { authenticate } from '../middleware/auth';
import { uploadDocument as uploadMiddleware } from '../middleware/upload';
import { uploadLimiter, apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', uploadLimiter, authenticate, uploadMiddleware.single('document'), uploadDocument);
router.get('/', apiLimiter, authenticate, getDocuments);
router.get('/:id', apiLimiter, authenticate, getDocument);
router.delete('/:id', apiLimiter, authenticate, deleteDocument);
router.get('/:id/download', apiLimiter, authenticate, downloadDocument);

export default router;
