import { Router } from 'express';
import {
  signDocument,
  getSignedDocuments,
  downloadSignedDocument,
  deleteSignedDocument,
} from '../controllers/signingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, signDocument);
router.get('/', authenticate, getSignedDocuments);
router.get('/:id/download', authenticate, downloadSignedDocument);
router.delete('/:id', authenticate, deleteSignedDocument);

export default router;
