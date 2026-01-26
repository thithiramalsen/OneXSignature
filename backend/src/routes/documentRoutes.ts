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

const router = Router();

router.post('/', authenticate, uploadMiddleware.single('document'), uploadDocument);
router.get('/', authenticate, getDocuments);
router.get('/:id', authenticate, getDocument);
router.delete('/:id', authenticate, deleteDocument);
router.get('/:id/download', authenticate, downloadDocument);

export default router;
