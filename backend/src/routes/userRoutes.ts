import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { deleteUser, getUsers, updateUserRole } from '../controllers/userController';

const router = Router();

router.use(apiLimiter, authenticate, authorize('admin'));

router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
